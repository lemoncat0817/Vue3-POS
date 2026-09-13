import { z } from 'zod'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'

/** 台灣手機號碼格式：09 開頭共 10 碼數字。結帳查會員、簡訊發送都靠這個格式成立。 */
export const memberPhoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{8}$/, '請輸入正確的手機號碼格式（09 開頭共 10 碼數字）')

/** 會員 schema。手機號碼為唯一識別鍵，消費依應付金額累積點數。 */
export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  points: z.number().int().nonnegative(),
  createdAt: z.string()
})
export type Member = z.infer<typeof memberSchema>

export const createMemberRequestSchema = z.object({
  name: z.string().trim().min(1),
  phone: memberPhoneSchema
})
export type CreateMemberRequest = z.infer<typeof createMemberRequestSchema>

export const updateMemberRequestSchema = createMemberRequestSchema
export type UpdateMemberRequest = z.infer<typeof updateMemberRequestSchema>

/**
 * GET /api/members 的查詢參數。phone 是結帳流程的精確查詢（維持既有行為，
 * 回應只會有 0～1 筆）；q 是後台會員名單的姓名/手機模糊搜尋，兩者互斥，
 * 帶 phone 時 q 會被忽略。分頁欄位沿用全站共用的 paginationQuerySchema。
 */
export const listMembersQuerySchema = paginationQuerySchema.extend({
  phone: z.string().min(1).optional(),
  q: z.string().trim().min(1).optional()
})
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>

export const memberListResponseSchema = createPaginatedResponseSchema(memberSchema)
export type MemberListResponse = z.infer<typeof memberListResponseSchema>

/** 會員的消費紀錄——訂單本身的形狀見 order.ts 的 orderSchema，這裡只挑列表用得到的欄位，不是另一份訂單資料來源。 */
export const memberOrderSummarySchema = z.object({
  orderId: z.string(),
  orderTime: z.string(),
  orderStatus: z.string(),
  orderPaymentPrice: z.number().int().nonnegative(),
  /** 這筆訂單消費當下累加的點數，固定不變；之後若退款/作廢收回點數不會回頭改寫這裡。 */
  pointsEarned: z.number().int()
})
export type MemberOrderSummary = z.infer<typeof memberOrderSummarySchema>

/**
 * 會員點數異動明細的來源分類。order_accrual／refund_reversal／void_reversal／
 * restore_award 由訂單流程自動寫入（見 apps/api/src/routes/orders.ts），
 * manual_adjustment 是後台手動加點/扣點（見 POST /api/members/:id/points-adjustments）。
 */
export const memberPointLedgerReasonSchema = z.enum([
  'order_accrual',
  'refund_reversal',
  'void_reversal',
  'restore_award',
  'manual_adjustment'
])
export type MemberPointLedgerReason = z.infer<typeof memberPointLedgerReasonSchema>

/** 單筆點數異動紀錄。delta 可正可負；orderId 只有訂單相關的異動才有值。 */
export const memberPointLedgerEntrySchema = z.object({
  id: z.string().min(1),
  delta: z.number().int(),
  reason: memberPointLedgerReasonSchema,
  orderId: z.string().nullable(),
  operator: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string()
})
export type MemberPointLedgerEntry = z.infer<typeof memberPointLedgerEntrySchema>

/** 手動調整點數的請求——常見於客訴補償、活動加點。delta 不能是 0（沒有意義的調整）。 */
export const manualPointAdjustmentRequestSchema = z.object({
  delta: z.number().int().refine((value) => value !== 0, '調整量不能是 0'),
  reason: z.string().trim().min(1, '請說明調整原因'),
  operator: z.string().trim().min(1)
})
export type ManualPointAdjustmentRequest = z.infer<typeof manualPointAdjustmentRequestSchema>

/** 會員詳細資料＋消費紀錄＋點數異動明細，GET /api/members/:id 的回應形狀。 */
export const memberDetailSchema = memberSchema.extend({
  orders: z.array(memberOrderSummarySchema),
  pointsLedger: z.array(memberPointLedgerEntrySchema)
})
export type MemberDetail = z.infer<typeof memberDetailSchema>
