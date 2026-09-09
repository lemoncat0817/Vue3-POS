import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  NO_DISCOUNT,
  priceLine,
  toggleFree,
  toggleQuickDiscount,
  type LineBase,
  type LineDiscountFlags,
  type QuickDiscount,
} from './pricing'
import { DEFAULT_QUICK_DISCOUNTS as QUICK_DISCOUNTS } from './fixtures/quick-discounts'

const quickDiscountIdArb = fc.constantFrom<string | null>(null, ...QUICK_DISCOUNTS.map((d) => d.id))

const flagsArb: fc.Arbitrary<LineDiscountFlags> = fc.record({
  freeDiscount: fc.boolean(),
  quickDiscountId: quickDiscountIdArb,
})

const lineBaseArb: fc.Arbitrary<LineBase> = fc.record({
  price: fc.integer({ min: 0, max: 300 }),
  count: fc.integer({ min: 1, max: 99 }),
  addListPrice: fc.integer({ min: 0, max: 100 }),
})

describe('priceLine — 對照原本各折扣情境的正向計算式', () => {
  it('無任何折扣時，總額等於原價', () => {
    const base: LineBase = { price: 90, count: 3, addListPrice: 0 }
    const priced = priceLine(base, NO_DISCOUNT, QUICK_DISCOUNTS)
    expect(priced.totalPrice).toBe(270)
    expect(priced.discount).toBe(0)
  })

  it('定額快速折扣：每份扣減固定金額', () => {
    const base: LineBase = { price: 80, count: 1, addListPrice: 0 }
    const flags = toggleQuickDiscount(NO_DISCOUNT, 'quick-1')
    const priced = priceLine(base, flags, QUICK_DISCOUNTS)
    expect(priced.totalPrice).toBe(75) // 80 - 5
    expect(priced.quickDiscountName).toBe('常客優惠')
  })

  it('折數快速折扣：整體乘上折數', () => {
    const base: LineBase = { price: 45, count: 30, addListPrice: 0 }
    const flags = toggleQuickDiscount(NO_DISCOUNT, 'quick-3')
    const priced = priceLine(base, flags, QUICK_DISCOUNTS)
    // 45*30=1350，九折=1215（與黃金資料集 202406107 訂單第一行金額一致）
    expect(priced.totalPrice).toBe(1215)
    expect(priced.discount).toBe(135)
  })

  it('招待：總額歸零，折扣金額等於原價，且優先於快速折扣', () => {
    const base: LineBase = { price: 90, count: 3, addListPrice: 0 }
    let flags = toggleQuickDiscount(NO_DISCOUNT, 'quick-1')
    flags = toggleFree(flags)
    const priced = priceLine(base, flags, QUICK_DISCOUNTS)
    expect(priced.totalPrice).toBe(0)
    expect(priced.discount).toBe(270)
  })

  it('找不到對應 id 的快速折扣時，視為未套用（例如後台已刪除該筆折扣）', () => {
    const base: LineBase = { price: 90, count: 1, addListPrice: 0 }
    const priced = priceLine(base, { freeDiscount: false, quickDiscountId: 'does-not-exist' }, QUICK_DISCOUNTS)
    expect(priced.totalPrice).toBe(90)
    expect(priced.discount).toBe(0)
  })
})

describe('計價不變式', () => {
  it('不變式：總額加折扣金額恆等於原價（無論任何旗標組合）', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, flags, QUICK_DISCOUNTS)
        const originalPrice = base.price * base.count + base.addListPrice * base.count
        expect(priced.totalPrice + priced.discount).toBe(originalPrice)
      }),
    )
  })

  it('不變式：總額永不為負', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, flags, QUICK_DISCOUNTS)
        expect(priced.totalPrice).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  it('不變式：招待旗標為真時，總額必為 0，無論其他旗標為何', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, { ...flags, freeDiscount: true }, QUICK_DISCOUNTS)
        expect(priced.totalPrice).toBe(0)
      }),
    )
  })

  it('不變式：切換招待兩次後，快速折扣選取必定回到未選取狀態', () => {
    fc.assert(
      fc.property(flagsArb, (flags) => {
        const result = toggleFree(toggleFree(flags))
        expect(result).toEqual({ ...NO_DISCOUNT, freeDiscount: flags.freeDiscount })
      }),
    )
  })

  it('不變式：同一時間只能套用一筆快速折扣', () => {
    fc.assert(
      fc.property(flagsArb, fc.constantFrom(...QUICK_DISCOUNTS.map((d) => d.id)), (flags, id) => {
        const result = toggleQuickDiscount(flags, id)
        expect(result.quickDiscountId === null || result.quickDiscountId === id).toBe(true)
      }),
    )
  })

  it('不變式：選同一筆快速折扣兩次後回到未選取狀態', () => {
    fc.assert(
      fc.property(flagsArb, fc.constantFrom(...QUICK_DISCOUNTS.map((d) => d.id)), (flags, id) => {
        const once = toggleQuickDiscount(flags, id)
        const twice = toggleQuickDiscount(once, id)
        expect(twice.quickDiscountId).toBe(flags.quickDiscountId === id ? id : null)
      }),
    )
  })

  it('不變式：後台可自由增刪快速折扣清單，priceLine() 不假設固定筆數', () => {
    const shortList: QuickDiscount[] = [{ id: 'only-one', name: '單一折扣', kind: 'amount', value: 3 }]
    const base: LineBase = { price: 50, count: 2, addListPrice: 0 }
    const priced = priceLine(base, { freeDiscount: false, quickDiscountId: 'only-one' }, shortList)
    expect(priced.totalPrice).toBe(94) // 100 - 3*2
  })
})
