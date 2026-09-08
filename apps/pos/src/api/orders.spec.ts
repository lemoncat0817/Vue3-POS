import { describe, expect, it } from 'vitest'
import type { CartLineItem } from '@/types'
import { buildCreateOrderRequest } from './orders'

const sampleLine: CartLineItem = {
  id: 1,
  name: '楊枝甘露2.0',
  price: '80',
  size: 'L',
  count: 1,
  discount: 0,
  addList: '無添加配料',
  addListPrice: 0,
  totalPrice: 80,
  currentDiscountPercent: 0,
  currentDiscountMoney: 0,
  useDiscountPercent: '',
  useDiscountMoney: '',
  useDiscountFree: '',
  freeDiscount: false,
  ecoDiscount: false,
  bottleDiscount: false,
  oftenUseDiscount1: false,
  oftenUseDiscount2: false,
  oftenUseDiscount3: false,
}

describe('buildCreateOrderRequest', () => {
  it('把 CartLineItem 的字串型金額（FormNumeric）正規化成 number', () => {
    const request = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      tenders: [{ method: '現金', amount: 80 }],
      appliedCoupon: { type: 'none' },
      orderChannel: '外帶',
    })

    expect(request.lines[0]).toMatchObject({ price: 80, count: 1 })
    expect(typeof request.lines[0]!.price).toBe('number')
  })

  it('每次呼叫都產生新的 idempotencyKey，符合 ulidSchema 格式', () => {
    const a = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      tenders: [{ method: '現金', amount: 80 }],
      appliedCoupon: { type: 'none' },
      orderChannel: '外帶',
    })
    const b = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      tenders: [{ method: '現金', amount: 80 }],
      appliedCoupon: { type: 'none' },
      orderChannel: '外帶',
    })

    expect(a.idempotencyKey).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey)
  })

  it('appliedCoupon 原封不動送出（money／percent 兩種形狀）', () => {
    const money = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      tenders: [{ method: '現金', amount: 80 }],
      appliedCoupon: { type: 'money', couponId: 'money-1' },
      orderChannel: '外帶',
    })
    expect(money.appliedCoupon).toEqual({ type: 'money', couponId: 'money-1' })

    const percent = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      tenders: [{ method: '現金', amount: 80 }],
      appliedCoupon: { type: 'percent', couponId: 'percent-1' },
      orderChannel: '外帶',
    })
    expect(percent.appliedCoupon).toEqual({ type: 'percent', couponId: 'percent-1' })
  })
})
