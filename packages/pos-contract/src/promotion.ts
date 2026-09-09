import { z } from 'zod'

export const quickDiscountKindSchema = z.enum(['amount', 'percent'])
export type QuickDiscountKind = z.infer<typeof quickDiscountKindSchema>

/**
 * 訂單折價券：整張訂單套用一張的具名折扣（例如「$50折價券」「整單95折」），
 * 後台可自由新增／刪除任意筆數。`kind: 'amount'` 時 `value` 是整筆折抵的
 * 金額；`kind: 'percent'` 時 `value` 是 0~1 的折數。跟 quickDiscountSchema
 * 同形狀是刻意的——原本現金／折數兩種各自獨立一張表，只是同一個「具名折
 * 扣、依 kind 決定金額或折數」概念被拆成兩份，跟快速折扣一樣統一成一張表。
 */
export const orderCouponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: quickDiscountKindSchema,
  value: z.number().nonnegative(),
})
export type OrderCoupon = z.infer<typeof orderCouponSchema>
export const createOrderCouponRequestSchema = orderCouponSchema.omit({ id: true })
export type CreateOrderCouponRequest = z.infer<typeof createOrderCouponRequestSchema>
export const updateOrderCouponRequestSchema = createOrderCouponRequestSchema
export type UpdateOrderCouponRequest = z.infer<typeof updateOrderCouponRequestSchema>

/**
 * 快速折扣：點餐頁購物車可直接套用在勾選品項上的具名折扣（例如「常客優惠」
 * 「員工優惠」），後台可自由新增／刪除任意筆數，不綁定特定產業的折扣種類。
 * `kind: 'amount'` 時 `value` 是每份扣減的金額；`kind: 'percent'` 時 `value`
 * 是 0~1 的折數。
 */
export const quickDiscountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: quickDiscountKindSchema,
  value: z.number().nonnegative(),
})
export type QuickDiscount = z.infer<typeof quickDiscountSchema>
export const createQuickDiscountRequestSchema = quickDiscountSchema.omit({ id: true })
export type CreateQuickDiscountRequest = z.infer<typeof createQuickDiscountRequestSchema>
export const updateQuickDiscountRequestSchema = createQuickDiscountRequestSchema
export type UpdateQuickDiscountRequest = z.infer<typeof updateQuickDiscountRequestSchema>

/** GET /api/promotions 的完整回應：點餐頁一次要用到的所有促銷資料。 */
export const promotionsResponseSchema = z.object({
  orderCoupons: z.array(orderCouponSchema),
  quickDiscounts: z.array(quickDiscountSchema),
})
export type PromotionsResponse = z.infer<typeof promotionsResponseSchema>

/** 訂單套用促銷意圖：只收券 ID，實際折抵金額由伺服端查詢折價券後重算，不信任用戶端數值。 */
export const appliedCouponSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('coupon'), couponId: z.string().min(1) }),
])
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>
