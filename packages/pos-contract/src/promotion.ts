import { z } from 'zod'

// 促銷 schema：命名使用 discountPercent（0~1）區隔 discountMoney，避免舊版欄位命名混淆。

/** 現金折價券（例如「$50折價券」），後台可自由新增／刪除。 */
export const moneyCouponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  discountMoney: z.number().int().nonnegative(),
})
export type MoneyCoupon = z.infer<typeof moneyCouponSchema>
export const createMoneyCouponRequestSchema = moneyCouponSchema.omit({ id: true })
export type CreateMoneyCouponRequest = z.infer<typeof createMoneyCouponRequestSchema>

/** 折數折價券（例如「整單95折」），後台可自由新增／刪除。 */
export const percentCouponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  discountPercent: z.number().min(0).max(1),
})
export type PercentCoupon = z.infer<typeof percentCouponSchema>
export const createPercentCouponRequestSchema = percentCouponSchema.omit({ id: true })
export type CreatePercentCouponRequest = z.infer<typeof createPercentCouponRequestSchema>

/** 常用折扣固定 5 筆（slot 0~1 容器群組互斥，2~4 折數群組互斥）。後台僅能編輯內容，無法增刪。 */
export const oftenUseRateSchema = z.object({
  slot: z.number().int().min(0).max(4),
  name: z.string().min(1),
  discountMoney: z.number().int().nonnegative(),
  discountPercent: z.number().min(0).max(1),
})
export type OftenUseRateEntry = z.infer<typeof oftenUseRateSchema>
export const updateOftenUseRateRequestSchema = oftenUseRateSchema.omit({ slot: true })
export type UpdateOftenUseRateRequest = z.infer<typeof updateOftenUseRateRequestSchema>

/** GET /api/promotions 的完整回應：點餐頁一次要用到的所有促銷資料。 */
export const promotionsResponseSchema = z.object({
  moneyCoupons: z.array(moneyCouponSchema),
  percentCoupons: z.array(percentCouponSchema),
  oftenUseRates: z.tuple([
    oftenUseRateSchema,
    oftenUseRateSchema,
    oftenUseRateSchema,
    oftenUseRateSchema,
    oftenUseRateSchema,
  ]),
})
export type PromotionsResponse = z.infer<typeof promotionsResponseSchema>

/** 訂單套用促銷意圖：只收券 ID，實際折抵金額由伺服端查詢折價券後重算，不信任用戶端數值。 */
export const appliedCouponSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('money'), couponId: z.string().min(1) }),
  z.object({ type: z.literal('percent'), couponId: z.string().min(1) }),
])
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>
