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
      payment: '現金',
      orderDiscount: 0,
      discountName: '無',
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
      payment: '現金',
      orderDiscount: 0,
      discountName: '無',
    })
    const b = buildCreateOrderRequest({
      businessDate: '20240610',
      staff: '店長 - Lemon',
      lines: [sampleLine],
      bagCount: 0,
      payment: '現金',
      orderDiscount: 0,
      discountName: '無',
    })

    expect(a.idempotencyKey).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey)
  })
})
