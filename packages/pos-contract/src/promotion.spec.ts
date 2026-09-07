import { describe, expect, it } from 'vitest'
import {
  appliedCouponSchema,
  createMoneyCouponRequestSchema,
  createPercentCouponRequestSchema,
  oftenUseRateSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  updateOftenUseRateRequestSchema,
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

describe('oftenUseRateSchema / updateOftenUseRateRequestSchema', () => {
  it('slot 必須是 0～4', () => {
    expect(
      oftenUseRateSchema.safeParse({ slot: 0, name: '環保折扣', discountMoney: 5, discountPercent: 1 }).success,
    ).toBe(true)
    expect(
      oftenUseRateSchema.safeParse({ slot: 5, name: '超出範圍', discountMoney: 0, discountPercent: 1 }).success,
    ).toBe(false)
  })

  it('更新請求不含 slot（由路徑參數指定，不是請求內容）', () => {
    expect(
      updateOftenUseRateRequestSchema.safeParse({ name: '環保折扣', discountMoney: 5, discountPercent: 1 }).success,
    ).toBe(true)
  })
})

describe('promotionsResponseSchema', () => {
  it('oftenUseRates 固定要有 5 筆', () => {
    const rate = (slot: number) => ({ slot, name: `rate-${slot}`, discountMoney: 0, discountPercent: 1 })
    const valid = {
      moneyCoupons: [],
      percentCoupons: [],
      oftenUseRates: [rate(0), rate(1), rate(2), rate(3), rate(4)],
    }
    expect(promotionsResponseSchema.safeParse(valid).success).toBe(true)
    expect(
      promotionsResponseSchema.safeParse({ ...valid, oftenUseRates: [rate(0), rate(1)] }).success,
    ).toBe(false)
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
