import { describe, expect, it } from 'vitest'
import {
  appliedCouponSchema,
  createOrderCouponRequestSchema,
  createQuickDiscountRequestSchema,
  orderCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  updateQuickDiscountRequestSchema
} from './promotion'

describe('orderCouponSchema', () => {
  it('kind 只接受 amount 或 percent', () => {
    expect(
      orderCouponSchema.safeParse({ id: 'c1', name: '$50折價券', kind: 'amount', value: 50 })
        .success
    ).toBe(true)
    expect(
      orderCouponSchema.safeParse({ id: 'c1', name: '整單9折', kind: 'percent', value: 0.9 })
        .success
    ).toBe(true)
    expect(
      orderCouponSchema.safeParse({ id: 'c1', name: '不合法', kind: 'ratio', value: 1 }).success
    ).toBe(false)
  })

  it('拒絕負數的折抵值', () => {
    expect(
      orderCouponSchema.safeParse({ id: 'c1', name: '負數', kind: 'amount', value: -1 }).success
    ).toBe(false)
  })
})

describe('createOrderCouponRequestSchema', () => {
  it('不需要（也不接受）id 欄位——由伺服端核發', () => {
    expect(
      createOrderCouponRequestSchema.safeParse({ name: '$50折價券', kind: 'amount', value: 50 })
        .success
    ).toBe(true)
  })
})

describe('quickDiscountSchema / updateQuickDiscountRequestSchema', () => {
  it('kind 只接受 amount 或 percent', () => {
    expect(
      quickDiscountSchema.safeParse({ id: 'q1', name: '常客優惠', kind: 'amount', value: 5 })
        .success
    ).toBe(true)
    expect(
      quickDiscountSchema.safeParse({ id: 'q1', name: '九折優惠', kind: 'percent', value: 0.9 })
        .success
    ).toBe(true)
    expect(
      quickDiscountSchema.safeParse({ id: 'q1', name: '不合法', kind: 'ratio', value: 1 }).success
    ).toBe(false)
  })

  it('更新請求不含 id（由路徑參數指定，不是請求內容）', () => {
    expect(
      updateQuickDiscountRequestSchema.safeParse({ name: '常客優惠', kind: 'amount', value: 5 })
        .success
    ).toBe(true)
  })

  it('拒絕負數的折抵值', () => {
    expect(
      createQuickDiscountRequestSchema.safeParse({ name: '常客優惠', kind: 'amount', value: -5 })
        .success
    ).toBe(false)
  })
})

describe('promotionsResponseSchema', () => {
  it('orderCoupons／quickDiscounts 可以是任意筆數（含 0 筆）', () => {
    const discount = (id: string) => ({
      id,
      name: `discount-${id}`,
      kind: 'amount' as const,
      value: 5
    })
    expect(
      promotionsResponseSchema.safeParse({ orderCoupons: [], quickDiscounts: [] }).success
    ).toBe(true)
    expect(
      promotionsResponseSchema.safeParse({
        orderCoupons: [discount('a'), discount('b')],
        quickDiscounts: [discount('c')]
      }).success
    ).toBe(true)
  })
})

describe('appliedCouponSchema', () => {
  it('type 為 none 時不需要 couponId', () => {
    expect(appliedCouponSchema.safeParse({ type: 'none' }).success).toBe(true)
  })

  it('type 為 coupon 時必須有 couponId', () => {
    expect(appliedCouponSchema.safeParse({ type: 'coupon', couponId: 'c1' }).success).toBe(true)
    expect(appliedCouponSchema.safeParse({ type: 'coupon' }).success).toBe(false)
  })

  it('拒絕不認得的 type', () => {
    expect(appliedCouponSchema.safeParse({ type: 'unknown' }).success).toBe(false)
  })
})
