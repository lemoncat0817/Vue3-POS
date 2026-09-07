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
 * 混合支付（重構規劃書 §10 P0「混合支付」，也是這一整組功能裡最先要
 * 做的一項——班別結算、退款、發票都要靠 tenders 才對得起帳）。
 *
 * 用戶端只送「這筆 tender 用什麼方式支付、分擔多少應付金額」，`amount`
 * 的總和必須剛好等於伺服端重算出的應付金額（見 orders.ts 的
 * validateTenders），不吃用戶端自己算的合計，理由跟品項金額不信任
 * 用戶端一致。`receivedAmount` 只用在需要找零的支付方式（主要是現金）
 * ——「實收」跟「這筆帳單分擔的金額」是兩件事：客人給 500 元付一筆
 * 88 元的單，`amount` 是 88，`receivedAmount` 是 500，差額 412 由伺服端
 * 算成 changeDue 找零，不需要用戶端自己算。
 *
 * `amount` 允許 0（不是 `positive()`）：現金折價券／折數折價券把應付
 * 金額折到 0 元時（見 orders.ts 的 resolveOrderPayment），這筆訂單
 * 仍然需要一筆 tender 才能結案（tenders 陣列至少 1 筆），只是分擔的
 * 金額是 0——這比另外為「完全免費的訂單」設計一套跳過付款畫面的特例
 * 簡單。
 */
export const tenderInputSchema = z
  .object({
    method: z.string().min(1),
    amount: z.number().int().nonnegative(),
    receivedAmount: z.number().int().positive().optional(),
  })
  .refine((tender) => tender.receivedAmount === undefined || tender.receivedAmount >= tender.amount, {
    message: '實收金額不能小於這筆支付分擔的金額',
    path: ['receivedAmount'],
  })
export type TenderInput = z.infer<typeof tenderInputSchema>

/** 伺服端回傳的 tender：跟輸入同形狀，沒有額外衍生欄位。 */
export const tenderSchema = z.object({
  method: z.string().min(1),
  amount: z.number().int().nonnegative(),
  receivedAmount: z.number().int().positive().optional(),
})
export type Tender = z.infer<typeof tenderSchema>

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
  tenders: z.array(tenderInputSchema).min(1),
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
  /** 顯示用的付款方式摘要（多筆 tender 時以頓號連接），非計算來源。 */
  orderPayment: z.string(),
  orderDiscount: z.number().int().nonnegative(),
  orderPaymentPrice: z.number().int().nonnegative(),
  discountName: z.string(),
  /** 這筆訂單實際收到的每一筆支付，見 tenderSchema 的說明。 */
  tenders: z.array(tenderSchema).min(1),
  /** 找零總額——由伺服端從 tenders 的 receivedAmount 算出，見 orders.ts。 */
  changeDue: z.number().int().nonnegative(),
})
export type Order = z.infer<typeof orderSchema>
