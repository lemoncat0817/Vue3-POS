import { z } from 'zod'

/**
 * 會員（P22：規劃書 §10 P22「會員與顧客經營」）。手機號碼是結帳當下
 * 查會員唯一合理的輸入方式（收銀機沒有讀卡機、也不會要求顧客記會員
 * 編號），因此是唯一鍵——見 routes/members.ts 的查詢／建立流程。
 *
 * points 是最基礎的點數規則：訂單完成時依應付金額累加（見 routes/
 * orders.ts 的 accrueMemberPoints），沒有兌換／折抵機制——那屬於
 * 「常用優惠」（P5）已經有的折價券系統可以之後再擴充銜接的範圍，這裡
 * 先把「消費會累積點數、看得到累積了多少」這個基礎做出來。
 */
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
