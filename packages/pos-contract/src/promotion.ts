import { z } from 'zod'

/**
 * 促銷相關的 schema（P5：規劃書 §10 的促銷引擎）。
 *
 * 這是伺服端的新設計，欄位選乾淨、誠實的命名——apps/pos 現行的
 * `PercentDiscount.discountMoney` 其實存的是折數（0.95），欄位名稱與
 * 意義不一致（P0 如實保留這個既有缺陷，不重新命名），伺服端不重複
 * 這個問題，用 `discountPercent`。
 */

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

/**
 * 常用折扣，固定 5 筆（見 @pos/domain 的 OftenUseRates）：
 * slot 0＝環保折扣、1＝瓶裝折扣（容器群組，互斥）、
 * 2～4＝三個折數折扣（折數群組，互斥）。後台只能編輯內容，不能新增或
 * 刪除，所以沒有對應的 create schema。
 */
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

/**
 * 訂單套用的促銷（P5：取代 createOrderRequestSchema 原本直接信任用戶端
 * 送來的 orderDiscount／discountName 數字——伺服端改成只收「套用了哪張
 * 折價券」，實際折抵金額由伺服端查真正的折價券資料重算，這是 D-01／
 * D-02 修復方式在訂單層級促銷的延伸。見 apps/api/src/routes/orders.ts。
 */
export const appliedCouponSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('money'), couponId: z.string().min(1) }),
  z.object({ type: z.literal('percent'), couponId: z.string().min(1) }),
])
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>
