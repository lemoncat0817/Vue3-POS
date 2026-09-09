import { z } from 'zod'

/** 會員 schema。手機號碼為唯一識別鍵，消費依應付金額累積點數。 */
export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  points: z.number().int().nonnegative(),
  createdAt: z.string(),
})
export type Member = z.infer<typeof memberSchema>

export const createMemberRequestSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
})
export type CreateMemberRequest = z.infer<typeof createMemberRequestSchema>

export const updateMemberRequestSchema = createMemberRequestSchema
export type UpdateMemberRequest = z.infer<typeof updateMemberRequestSchema>

/** 會員的消費紀錄——訂單本身的形狀見 order.ts 的 orderSchema，這裡只挑列表用得到的欄位，不是另一份訂單資料來源。 */
export const memberOrderSummarySchema = z.object({
  orderId: z.string(),
  orderTime: z.string(),
  orderStatus: z.string(),
  orderPaymentPrice: z.number().int().nonnegative(),
})
export type MemberOrderSummary = z.infer<typeof memberOrderSummarySchema>

/** 會員詳細資料＋消費紀錄，GET /api/members/:id 的回應形狀。 */
export const memberDetailSchema = memberSchema.extend({
  orders: z.array(memberOrderSummarySchema),
})
export type MemberDetail = z.infer<typeof memberDetailSchema>
