import { z } from 'zod'
import { businessDateSchema, ulidSchema } from './common'

/**
 * 訂單相關的 schema。
 *
 * 設計原則（見重構規劃書 §6）：用戶端只送出「選了什麼」（品項基本資料
 * ＋折扣旗標），金額一律由伺服端用 @pos/domain 的 priceLine() 重新
 * 計算——用戶端完全不需要、也不被信任送出算好的金額。這是
 * D-01／D-02 的修復方式在伺服端的延伸：同一份計價邏輯只存在一個地方。
 */

export const lineDiscountFlagsSchema = z.object({
  freeDiscount: z.boolean(),
  ecoDiscount: z.boolean(),
  bottleDiscount: z.boolean(),
  oftenUseDiscount1: z.boolean(),
  oftenUseDiscount2: z.boolean(),
  oftenUseDiscount3: z.boolean(),
})
export type LineDiscountFlagsInput = z.infer<typeof lineDiscountFlagsSchema>

/** 用戶端提交的單一品項：只有「意圖」，沒有算好的金額。 */
export const orderLineInputSchema = z
  .object({
    name: z.string().min(1),
    price: z.number().int().nonnegative(),
    size: z.string().min(1),
    count: z.number().int().positive(),
    addList: z.union([z.literal('無添加配料'), z.array(z.string())]),
    addListPrice: z.number().int().nonnegative(),
  })
  .extend(lineDiscountFlagsSchema.shape)
export type OrderLineInput = z.infer<typeof orderLineInputSchema>

export const paymentUseMethodSchema = z.enum(['紙鈔', '感應', '掃描'])
export type PaymentUseMethod = z.infer<typeof paymentUseMethodSchema>

/** 送出訂單的請求。orderDiscount 是訂單層級折價券折抵金額——訂單層級
 *  的折價券計算邏輯尚未搬進 @pos/domain（現金／折數折價券目前只存在
 *  於用戶端的 discountStore，見規劃書 P5 促銷引擎），因此這個欄位現階段
 *  仍由用戶端提供；伺服端會確保 `應付金額 = 品項小計加總 - orderDiscount`
 *  且不得為負，但不會重新驗證這個折抵金額本身是否對應真實存在的
 *  折價券。 */
export const createOrderRequestSchema = z.object({
  idempotencyKey: ulidSchema,
  businessDate: businessDateSchema,
  staff: z.string().min(1),
  lines: z.array(orderLineInputSchema).min(1),
  bagCount: z.number().int().nonnegative(),
  payment: z.string().min(1),
  orderDiscount: z.number().int().nonnegative(),
  discountName: z.string(),
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const orderStatusSchema = z.enum(['已完成', '已取消'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** 伺服端重算後、含完整金額的品項。 */
export const orderLineSchema = orderLineInputSchema.extend({
  discount: z.number().int(),
  totalPrice: z.number().int().nonnegative(),
  currentDiscountMoney: z.number().nonnegative(),
  currentDiscountPercent: z.number().min(0).max(1),
  useDiscountMoney: z.string(),
  useDiscountPercent: z.string(),
  useDiscountFree: z.string(),
})
export type OrderLine = z.infer<typeof orderLineSchema>

/** 伺服端回傳的完整訂單。 */
export const orderSchema = z.object({
  orderId: z.string(),
  orderTime: z.string(),
  orderStatus: orderStatusSchema,
  staff: z.string(),
  orderData: z.array(orderLineSchema),
  orderBagCount: z.number().int().nonnegative(),
  orderCupCount: z.number().int().nonnegative(),
  orderTotalPrice: z.number().int().nonnegative(),
  orderPayment: z.string(),
  orderDiscount: z.number().int().nonnegative(),
  orderPaymentPrice: z.number().int().nonnegative(),
  discountName: z.string(),
})
export type Order = z.infer<typeof orderSchema>
