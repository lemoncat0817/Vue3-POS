import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  NO_DISCOUNT,
  priceLine,
  toggleContainer,
  toggleFree,
  toggleRate,
  type LineBase,
  type LineDiscountFlags,
} from './pricing'
import { DEFAULT_OFTEN_USE_RATES as OFTEN_USE } from './fixtures/often-use-rates'

const flagsArb: fc.Arbitrary<LineDiscountFlags> = fc.record({
  freeDiscount: fc.boolean(),
  ecoDiscount: fc.boolean(),
  bottleDiscount: fc.boolean(),
  oftenUseDiscount1: fc.boolean(),
  oftenUseDiscount2: fc.boolean(),
  oftenUseDiscount3: fc.boolean(),
})

const lineBaseArb: fc.Arbitrary<LineBase> = fc.record({
  price: fc.integer({ min: 0, max: 300 }),
  count: fc.integer({ min: 1, max: 99 }),
  addListPrice: fc.integer({ min: 0, max: 100 }),
})

describe('priceLine — 對照原本六個折扣函式的正向計算式', () => {
  it('無任何折扣時，總額等於原價', () => {
    const base: LineBase = { price: 90, count: 3, addListPrice: 0 }
    const priced = priceLine(base, NO_DISCOUNT, OFTEN_USE)
    expect(priced.totalPrice).toBe(270)
    expect(priced.discount).toBe(0)
  })

  it('環保折扣：每杯扣減定額（對照現行 ecoDiscount 的計算式）', () => {
    const base: LineBase = { price: 80, count: 1, addListPrice: 0 }
    const flags = toggleContainer(NO_DISCOUNT, 'eco')
    const priced = priceLine(base, flags, OFTEN_USE)
    expect(priced.totalPrice).toBe(75) // 80 - 5
    expect(priced.useDiscountMoney).toBe('環保折扣')
  })

  it('九折：整體乘上折數（對照現行 oftenUseDiscount1 的計算式）', () => {
    const base: LineBase = { price: 45, count: 30, addListPrice: 0 }
    const flags = toggleRate(NO_DISCOUNT, 1)
    const priced = priceLine(base, flags, OFTEN_USE)
    // 45*30=1350，九折=1215（與黃金資料集 202406107 訂單第一行金額一致）
    expect(priced.totalPrice).toBe(1215)
    expect(priced.discount).toBe(135)
  })

  it('招待：總額歸零，折扣金額等於原價，且優先於容器與折數折扣', () => {
    const base: LineBase = { price: 90, count: 3, addListPrice: 0 }
    let flags = toggleContainer(NO_DISCOUNT, 'bottle')
    flags = toggleFree(flags)
    const priced = priceLine(base, flags, OFTEN_USE)
    expect(priced.totalPrice).toBe(0)
    expect(priced.discount).toBe(270)
    expect(priced.useDiscountFree).toBe('招待')
  })
})

describe('計價不變式（見重構規劃書 §13，修復 D-01／D-02 的驗證基準）', () => {
  it('不變式：總額加折扣金額恆等於原價（無論任何旗標組合）', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, flags, OFTEN_USE)
        const originalPrice = base.price * base.count + base.addListPrice * base.count
        expect(priced.totalPrice + priced.discount).toBe(originalPrice)
      }),
    )
  })

  it('不變式：總額永不為負', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, flags, OFTEN_USE)
        expect(priced.totalPrice).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  it('不變式：招待旗標為真時，總額必為 0，無論其他旗標為何', () => {
    fc.assert(
      fc.property(lineBaseArb, flagsArb, (base, flags) => {
        const priced = priceLine(base, { ...flags, freeDiscount: true }, OFTEN_USE)
        expect(priced.totalPrice).toBe(0)
        expect(priced.useDiscountFree).toBe('招待')
      }),
    )
  })

  it('不變式：切換招待兩次後，其餘旗標必定回到未選取狀態（修復 D-02）', () => {
    fc.assert(
      fc.property(flagsArb, (flags) => {
        const result = toggleFree(toggleFree(flags))
        expect(result).toEqual({ ...NO_DISCOUNT, freeDiscount: flags.freeDiscount })
      }),
    )
  })

  it('不變式：容器折扣群組（環保／瓶裝）切換後恆互斥', () => {
    fc.assert(
      fc.property(flagsArb, fc.constantFrom<'eco' | 'bottle'>('eco', 'bottle'), (flags, which) => {
        const result = toggleContainer(flags, which)
        expect(result.ecoDiscount && result.bottleDiscount).toBe(false)
      }),
    )
  })

  it('不變式：折數折扣群組（九折／八五折／員工八折）切換後恆互斥', () => {
    fc.assert(
      fc.property(flagsArb, fc.constantFrom<1 | 2 | 3>(1, 2, 3), (flags, which) => {
        const result = toggleRate(flags, which)
        const activeCount = [result.oftenUseDiscount1, result.oftenUseDiscount2, result.oftenUseDiscount3].filter(
          Boolean,
        ).length
        expect(activeCount).toBeLessThanOrEqual(1)
      }),
    )
  })

  it('不變式：容器與折數屬於不同群組，套用順序不影響最終計價結果', () => {
    fc.assert(
      fc.property(lineBaseArb, fc.constantFrom<1 | 2 | 3>(1, 2, 3), (base, rateWhich) => {
        const orderA = toggleRate(toggleContainer(NO_DISCOUNT, 'eco'), rateWhich)
        const orderB = toggleContainer(toggleRate(NO_DISCOUNT, rateWhich), 'eco')
        expect(priceLine(base, orderA, OFTEN_USE)).toEqual(priceLine(base, orderB, OFTEN_USE))
      }),
    )
  })
})
