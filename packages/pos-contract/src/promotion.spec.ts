import { describe, expect, it } from 'vitest'
import {
  appliedCouponSchema,
  createMoneyCouponRequestSchema,
  createPercentCouponRequestSchema,
  createQuickDiscountRequestSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  updateQuickDiscountRequestSchema,
} from './promotion'

describe('percentCouponSchema', () => {
  it('discountPercent 必須介於 0～1 之間', () => {
    expect(percentCouponSchema.safeParse({ id: 'p1', name: '九折', discountPercent: 0.9 }).success).toBe(true)
    expect(percentCouponSchema.safeParse({ id: 'p1', name: '超過100%', discountPercent: 1.5 }).success).toBe(false)
    expect(percentCouponSchema.safeParse({ id: 'p1', name: '負數', discountPercent: -0.1 }).success).toBe(false)
  })
})

describe('createMoneyCouponRequestSchema / createPercentCouponRequestSchema', () => {
  it('不需要（也不接受）id 欄位——由伺服端核發', () => {
    expect(createMoneyCouponRequestSchema.safeParse({ name: '$50折價券', discountMoney: 50 }).success).toBe(true)
    expect(createPercentCouponRequestSchema.safeParse({ name: '九折', discountPercent: 0.9 }).success).toBe(true)
  })
})

describe('quickDiscountSchema / updateQuickDiscountRequestSchema', () => {
  it('kind 只接受 amount 或 percent', () => {
    expect(quickDiscountSchema.safeParse({ id: 'q1', name: '常客優惠', kind: 'amount', value: 5 }).success).toBe(true)
    expect(quickDiscountSchema.safeParse({ id: 'q1', name: '九折優惠', kind: 'percent', value: 0.9 }).success).toBe(true)
    expect(quickDiscountSchema.safeParse({ id: 'q1', name: '不合法', kind: 'ratio', value: 1 }).success).toBe(false)
  })

  it('更新請求不含 id（由路徑參數指定，不是請求內容）', () => {
    expect(
      updateQuickDiscountRequestSchema.safeParse({ name: '常客優惠', kind: 'amount', value: 5 }).success,
    ).toBe(true)
  })

  it('拒絕負數的折抵值', () => {
    expect(createQuickDiscountRequestSchema.safeParse({ name: '常客優惠', kind: 'amount', value: -5 }).success).toBe(false)
  })
})

describe('promotionsResponseSchema', () => {
  it('quickDiscounts 可以是任意筆數（含 0 筆）', () => {
    const discount = (id: string) => ({ id, name: `discount-${id}`, kind: 'amount' as const, value: 5 })
    expect(promotionsResponseSchema.safeParse({ moneyCoupons: [], percentCoupons: [], quickDiscounts: [] }).success).toBe(true)
    expect(
      promotionsResponseSchema.safeParse({
        moneyCoupons: [],
        percentCoupons: [],
        quickDiscounts: [discount('a'), discount('b'), discount('c')],
      }).success,
    ).toBe(true)
  })
})

describe('appliedCouponSchema', () => {
  it('type 為 none 時不需要 couponId', () => {
    expect(appliedCouponSchema.safeParse({ type: 'none' }).success).toBe(true)
  })

  it('type 為 money／percent 時必須有 couponId', () => {
    expect(appliedCouponSchema.safeParse({ type: 'money', couponId: 'money-1' }).success).toBe(true)
    expect(appliedCouponSchema.safeParse({ type: 'money' }).success).toBe(false)
  })

  it('拒絕不認得的 type', () => {
    expect(appliedCouponSchema.safeParse({ type: 'unknown' }).success).toBe(false)
  })
})
