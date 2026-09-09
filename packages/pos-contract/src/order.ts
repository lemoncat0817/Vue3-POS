import { z } from 'zod'
import { businessDateSchema, ulidSchema } from './common'
import { invoiceStatusSchema } from './invoice'
import { appliedCouponSchema } from './promotion'

// 訂單相關的 schema。設計原則：用戶端只送出「選了什麼」（品項基本資料
// ＋折扣旗標），金額一律由伺服端用 @pos/domain 的 priceLine() 重新計算
// ——用戶端完全不需要、也不被信任送出算好的金額，同一份計價邏輯只存在一個地方。

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

// 用戶端只送「這筆 tender 用什麼方式支付、分擔多少應付金額」，amount
// 的總和必須剛好等於伺服端重算出的應付金額（見 orders.ts 的
// validateTenders）。receivedAmount 只用在需要找零的支付方式：客人給
// 500 元付一筆 88 元的單，amount 是 88、receivedAmount 是 500，差額
// 412 由伺服端算成 changeDue。amount 允許 0（不是 positive()）：折價券
// 把應付金額折到 0 元時，仍需要一筆 tender 才能結案，只是分擔金額是 0。
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

// 只有內用／外帶兩種值，不做成開放字串：封閉的小型列舉比自由字串更容易
// 在 UI 上排版（固定兩顆按鈕）跟報表上分組，理由跟 orderStatusSchema 一致。
export const orderChannelSchema = z.enum(['內用', '外帶'])
export type OrderChannel = z.infer<typeof orderChannelSchema>

// 手機條碼格式（財政部規定）：「/」開頭＋7 碼（數字、大寫英文字母、或
// . + - 三個符號）。統一編號：8 碼數字，用於企業客戶對帳（B2B）。
// 「無載具」代表開紙本發票，不需要 value。
export const invoiceCarrierTypeSchema = z.enum(['無載具', '手機條碼', '統一編號'])
export type InvoiceCarrierType = z.infer<typeof invoiceCarrierTypeSchema>

export const invoiceCarrierSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('無載具') }),
  z.object({
    type: z.literal('手機條碼'),
    value: z.string().regex(/^\/[0-9A-Z.+-]{7}$/, '手機條碼格式錯誤，需為「/」開頭加 7 碼數字或大寫英文字母'),
  }),
  z.object({
    type: z.literal('統一編號'),
    value: z.string().regex(/^\d{8}$/, '統一編號需為 8 碼數字'),
  }),
])
export type InvoiceCarrier = z.infer<typeof invoiceCarrierSchema>

// appliedCoupon 只是「套用了哪張折價券」的意圖，實際折抵金額
// （orderDiscount）與名稱（discountName）由伺服端查真正的折價券資料
// 重算，不信任用戶端算好的數字（見 apps/api/src/routes/orders.ts）。
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
  /** 選填，沒有輸入會員手機就是一般訂單。伺服端依應付金額累加點數（見 routes/orders.ts 的 accrueMemberPoints）。 */
  memberId: z.string().min(1).optional(),
  /** 選填，純粹是訂單的紀錄用途，不是桌況的外鍵——桌況由店員手動維護，不由訂單生命週期推導。 */
  tableNumber: z.string().min(1).optional(),
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

// refundId 是用戶端在退款當下用 ULID 產生並送入，理由跟訂單的
// idempotencyKey、班別的 shiftId 一致：同一個 refundId 重送不會建立
// 第二筆退款紀錄。amount 是這一筆退款的金額，不是「退款後剩餘應付
// 金額」——伺服端會用 summarizeOrderRefunds() 驗證是否超過可退額度。
export const refundInputSchema = z.object({
  refundId: ulidSchema,
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1),
})
export type RefundInput = z.infer<typeof refundInputSchema>

/** 伺服端回傳的退款紀錄：跟輸入同形狀，加上伺服端配發的 id 與時間。 */
export const refundSchema = z.object({
  id: z.string(),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  operator: z.string().min(1),
  at: z.string(),
})
export type Refund = z.infer<typeof refundSchema>

/** 伺服端回傳的完整訂單。 */
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
  /** 顯示用的付款方式摘要（多筆 tender 時以頓號連接），非計算來源。 */
  orderPayment: z.string(),
  orderDiscount: z.number().int().nonnegative(),
  orderPaymentPrice: z.number().int().nonnegative(),
  discountName: z.string(),
  tenders: z.array(tenderSchema).min(1),
  /** 找零總額——由伺服端從 tenders 的 receivedAmount 算出。 */
  changeDue: z.number().int().nonnegative(),
  refunds: z.array(refundSchema),
  /** 已退金額總和——由伺服端從 refunds 算出，見 @pos/domain 的 summarizeOrderRefunds()。 */
  refundedAmount: z.number().int().nonnegative(),
  /** 作廢原因。只有 orderStatus 為「已取消」時才有值。 */
  voidReason: z.string().nullable(),
  voidedBy: z.string().nullable(),
  voidedAt: z.string().nullable(),
  invoiceNumber: z.string(),
  invoiceCarrier: invoiceCarrierSchema,
  /** 沒有掛會員是 null。 */
  memberId: z.string().nullable(),
  /** 沒有指定是 null。 */
  tableNumber: z.string().nullable(),
  invoiceStatus: invoiceStatusSchema,
  invoiceSubmittedAt: z.string().nullable(),
})
export type Order = z.infer<typeof orderSchema>
