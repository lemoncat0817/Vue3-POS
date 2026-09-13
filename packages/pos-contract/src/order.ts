import { z } from 'zod'
import { businessDateSchema, ulidSchema } from './common'
import { invoiceStatusSchema } from './invoice'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'
import { appliedCouponSchema } from './promotion'

export const lineDiscountFlagsSchema = z.object({
  freeDiscount: z.boolean(),
  quickDiscountId: z.string().min(1).nullable()
})
export type LineDiscountFlagsInput = z.infer<typeof lineDiscountFlagsSchema>

export const orderLineInputSchema = z
  .object({
    name: z.string().min(1),
    price: z.number().int().nonnegative(),
    count: z.number().int().positive(),
    addList: z.union([z.literal('無添加配料'), z.array(z.string())]),
    addListPrice: z.number().int().nonnegative()
  })
  .extend(lineDiscountFlagsSchema.shape)
export type OrderLineInput = z.infer<typeof orderLineInputSchema>

export const paymentUseMethodSchema = z.enum(['紙鈔', '感應', '掃描'])
export type PaymentUseMethod = z.infer<typeof paymentUseMethodSchema>

export const tenderInputSchema = z
  .object({
    method: z.string().min(1),
    amount: z.number().int().nonnegative(),
    receivedAmount: z.number().int().positive().optional()
  })
  .refine(
    (tender) => tender.receivedAmount === undefined || tender.receivedAmount >= tender.amount,
    {
      message: '實收金額不能小於這筆支付分擔的金額',
      path: ['receivedAmount']
    }
  )
export type TenderInput = z.infer<typeof tenderInputSchema>

export const tenderSchema = z.object({
  method: z.string().min(1),
  amount: z.number().int().nonnegative(),
  receivedAmount: z.number().int().positive().optional()
})
export type Tender = z.infer<typeof tenderSchema>

export const orderChannelSchema = z.enum(['內用', '外帶'])
export type OrderChannel = z.infer<typeof orderChannelSchema>

export const invoiceCarrierTypeSchema = z.enum(['無載具', '手機條碼', '統一編號'])
export type InvoiceCarrierType = z.infer<typeof invoiceCarrierTypeSchema>

export const invoiceCarrierSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('無載具') }),
  z.object({
    type: z.literal('手機條碼'),
    value: z
      .string()
      .regex(/^\/[0-9A-Z.+-]{7}$/, '手機條碼格式錯誤，需為「/」開頭加 7 碼數字或大寫英文字母')
  }),
  z.object({
    type: z.literal('統一編號'),
    value: z.string().regex(/^\d{8}$/, '統一編號需為 8 碼數字')
  })
])
export type InvoiceCarrier = z.infer<typeof invoiceCarrierSchema>

export const createOrderRequestSchema = z.object({
  idempotencyKey: ulidSchema,
  businessDate: businessDateSchema,
  staff: z.string().min(1),
  lines: z.array(orderLineInputSchema).min(1),
  bagCount: z.number().int().nonnegative(),
  tenders: z.array(tenderInputSchema).min(1),
  appliedCoupon: appliedCouponSchema,
  orderChannel: orderChannelSchema,
  invoiceCarrier: invoiceCarrierSchema,
  memberId: z.string().min(1).optional(),
  pointsToRedeem: z.number().int().nonnegative().optional(),
  tableNumber: z.string().min(1).optional(),
  guestCount: z.number().int().positive().optional(),
  note: z.string().max(200).optional()
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const orderStatusSchema = z.enum(['已完成', '已取消'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderLineSchema = orderLineInputSchema.extend({
  discount: z.number().int(),
  totalPrice: z.number().int().nonnegative(),
  quickDiscountName: z.string()
})
export type OrderLine = z.infer<typeof orderLineSchema>

export const refundInputSchema = z.object({
  refundId: ulidSchema,
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1)
})
export type RefundInput = z.infer<typeof refundInputSchema>

export const refundSchema = z.object({
  id: z.string(),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1),
  at: z.string()
})
export type Refund = z.infer<typeof refundSchema>

export const orderSchema = z.object({
  orderId: z.string(),
  orderTime: z.string(),
  orderStatus: orderStatusSchema,
  orderChannel: orderChannelSchema,
  staff: z.string(),
  orderData: z.array(orderLineSchema),
  orderBagCount: z.number().int().nonnegative(),
  orderCupCount: z.number().int().nonnegative(),
  orderTotalPrice: z.number().int().nonnegative(),
  orderPayment: z.string(),
  orderDiscount: z.number().int().nonnegative(),
  orderPaymentPrice: z.number().int().nonnegative(),
  discountName: z.string(),
  tenders: z.array(tenderSchema).min(1),
  changeDue: z.number().int().nonnegative(),
  refunds: z.array(refundSchema),
  refundedAmount: z.number().int().nonnegative(),
  voidReason: z.string().nullable(),
  voidedBy: z.string().nullable(),
  voidedAt: z.string().nullable(),
  invoiceNumber: z.string(),
  invoiceCarrier: invoiceCarrierSchema,
  memberId: z.string().nullable(),
  memberName: z.string().nullable(),
  memberPhone: z.string().nullable(),
  pointsEarned: z.number().int().nonnegative(),
  pointsRedeemed: z.number().int().nonnegative(),
  tableNumber: z.string().nullable(),
  note: z.string().nullable(),
  invoiceStatus: invoiceStatusSchema,
  invoiceSubmittedAt: z.string().nullable()
})
export type Order = z.infer<typeof orderSchema>

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '必須是 YYYY-MM-DD 格式').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '必須是 YYYY-MM-DD 格式').optional(),
  channel: orderChannelSchema.optional(),
  staff: z.string().optional(),
  status: orderStatusSchema.optional(),
  payMethod: z.string().optional()
})
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>

export const orderListResponseSchema = createPaginatedResponseSchema(orderSchema)
export type OrderListResponse = z.infer<typeof orderListResponseSchema>

export const orderSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  totalRevenue: z.number().int(),
  completedCount: z.number().int().nonnegative(),
  voidCount: z.number().int().nonnegative(),
  refundCount: z.number().int().nonnegative(),
  staffNames: z.array(z.string())
})
export type OrderSummary = z.infer<typeof orderSummarySchema>
