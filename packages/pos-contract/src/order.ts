import { z } from 'zod'
import { businessDateSchema, ulidSchema } from './common'
import { appliedCouponSchema } from './promotion'

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

/**
 * 送出訂單的請求。appliedCoupon 只是「套用了哪張折價券」的意圖（P5：
 * 促銷引擎），實際折抵金額（orderDiscount）與名稱（discountName）由
 * 伺服端查真正的折價券資料重算——這是 D-01／D-02 修復方式在訂單層級
 * 促銷的延伸，見 apps/api/src/routes/orders.ts。P4 以前這裡曾經直接
 * 收用戶端算好的 orderDiscount／discountName 數字，不驗證是否對應
 * 真實存在的折價券，是身分系統落地前的一個真實缺口。
 */
export const createOrderRequestSchema = z.object({
  idempotencyKey: ulidSchema,
  businessDate: businessDateSchema,
  staff: z.string().min(1),
  lines: z.array(orderLineInputSchema).min(1),
  bagCount: z.number().int().nonnegative(),
  payment: z.string().min(1),
  appliedCoupon: appliedCouponSchema,
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
