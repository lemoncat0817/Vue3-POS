import { z } from 'zod'
import { memberTierStatusSchema } from './member-tier'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'

/** 台灣手機號碼格式：09 開頭共 10 碼數字。結帳查會員、簡訊發送都靠這個格式成立。 */
export const memberPhoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{8}$/, '請輸入正確的手機號碼格式（09 開頭共 10 碼數字）')

/** 生日格式 YYYY-MM-DD，對應 <input type="date"> 的原生格式。選填，用於生日行銷。 */
export const memberBirthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入正確的日期格式（YYYY-MM-DD）')

/** 會員 schema。手機號碼為唯一識別鍵，消費依應付金額累積點數。 */
export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  points: z.number().int().nonnegative(),
  birthday: z.string().nullable(),
  /** 自由標記（例如「常點無糖」「對堅果過敏」），純顯示用途，不是分級或權限。 */
  tags: z.array(z.string().min(1)),
  /** 顧客備註，自由文字，選填。 */
  notes: z.string().nullable(),
  createdAt: z.string(),
  // 只有列表／詳細資料會即時算好附上；建立/更新/調整點數的回應不含這欄，
  // 那幾個場景用不到、算了也是浪費一次查詢。
  tierStatus: memberTierStatusSchema.optional()
})
export type Member = z.infer<typeof memberSchema>

export const createMemberRequestSchema = z.object({
  name: z.string().trim().min(1),
  phone: memberPhoneSchema,
  birthday: memberBirthdaySchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  notes: z.string().trim().max(1000).nullable().optional()
})
export type CreateMemberRequest = z.infer<typeof createMemberRequestSchema>

export const updateMemberRequestSchema = createMemberRequestSchema
export type UpdateMemberRequest = z.infer<typeof updateMemberRequestSchema>

/** 本月壽星名單的查詢參數。month 不帶時預設伺服端當下月份。 */
export const memberBirthdaysQuerySchema = z.object({
  month: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, 'month 必須是 01～12')
    .optional()
})
export type MemberBirthdaysQuery = z.infer<typeof memberBirthdaysQuerySchema>

export const memberBirthdayEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  birthday: z.string()
})
export type MemberBirthdayEntry = z.infer<typeof memberBirthdayEntrySchema>

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
 * restore_award／redemption／redemption_refund 由訂單流程自動寫入（見
 * apps/api/src/routes/orders.ts），manual_adjustment 是後台手動加點/扣點
 * （見 POST /api/members/:id/points-adjustments），expiration 是點數到期
 * 規則整包歸零（見 apps/api/src/db/member-points.ts 的 maybeExpireMemberPoints）。
 *
 * redemption 是結帳當下拿點數折抵的扣點；redemption_refund 是訂單整單作廢
 * 時把折抵掉的點數還回去（作廢後又撤銷作廢，會重新扣一次 redemption）。
 * 部分退款不會自動調整已折抵的點數，需要的話用手動調整補回來。
 */
export const memberPointLedgerReasonSchema = z.enum([
  'order_accrual',
  'refund_reversal',
  'void_reversal',
  'restore_award',
  'redemption',
  'redemption_refund',
  'manual_adjustment',
  'expiration'
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

/** GET /api/members/:id 的查詢參數：消費紀錄用分頁欄位，避免老會員訂單一多整包吐回來。 */
export const memberDetailQuerySchema = paginationQuerySchema
export type MemberDetailQuery = z.infer<typeof memberDetailQuerySchema>

/** 會員詳細資料＋消費紀錄（分頁）＋點數異動明細，GET /api/members/:id 的回應形狀。 */
export const memberDetailSchema = memberSchema.extend({
  orders: createPaginatedResponseSchema(memberOrderSummarySchema),
  pointsLedger: z.array(memberPointLedgerEntrySchema)
})
export type MemberDetail = z.infer<typeof memberDetailSchema>

/** 分級人數分布的其中一格；tierId 為 null 代表「一般會員」（沒有任何門檻達標）。 */
export const memberTierDistributionEntrySchema = z.object({
  tierId: z.string().nullable(),
  tierName: z.string(),
  memberCount: z.number().int().nonnegative()
})
export type MemberTierDistributionEntry = z.infer<typeof memberTierDistributionEntrySchema>

/**
 * 會員經營摘要，GET /api/members/analytics 的回應形狀。memberRevenue／
 * totalRevenue 都排除已取消訂單，跟 reports.ts 的營收計算同一套規則。
 */
export const memberAnalyticsSchema = z.object({
  totalMembers: z.number().int().nonnegative(),
  newMembersThisMonth: z.number().int().nonnegative(),
  memberRevenue: z.number().int().nonnegative(),
  totalRevenue: z.number().int().nonnegative(),
  tierDistribution: z.array(memberTierDistributionEntrySchema)
})
export type MemberAnalytics = z.infer<typeof memberAnalyticsSchema>
