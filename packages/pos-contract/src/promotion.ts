import { z } from 'zod'

export const quickDiscountKindSchema = z.enum(['amount', 'percent'])
export type QuickDiscountKind = z.infer<typeof quickDiscountKindSchema>

export const orderCouponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: quickDiscountKindSchema,
  value: z.number().nonnegative()
})
export type OrderCoupon = z.infer<typeof orderCouponSchema>
export const createOrderCouponRequestSchema = orderCouponSchema.omit({ id: true })
export type CreateOrderCouponRequest = z.infer<typeof createOrderCouponRequestSchema>
export const updateOrderCouponRequestSchema = createOrderCouponRequestSchema
export type UpdateOrderCouponRequest = z.infer<typeof updateOrderCouponRequestSchema>

export const quickDiscountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: quickDiscountKindSchema,
  value: z.number().nonnegative()
})
export type QuickDiscount = z.infer<typeof quickDiscountSchema>
export const createQuickDiscountRequestSchema = quickDiscountSchema.omit({ id: true })
export type CreateQuickDiscountRequest = z.infer<typeof createQuickDiscountRequestSchema>
export const updateQuickDiscountRequestSchema = createQuickDiscountRequestSchema
export type UpdateQuickDiscountRequest = z.infer<typeof updateQuickDiscountRequestSchema>

export const promotionsResponseSchema = z.object({
  orderCoupons: z.array(orderCouponSchema),
  quickDiscounts: z.array(quickDiscountSchema)
})
export type PromotionsResponse = z.infer<typeof promotionsResponseSchema>

export const appliedCouponSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('coupon'), couponId: z.string().min(1) })
])
export type AppliedCoupon = z.infer<typeof appliedCouponSchema>
