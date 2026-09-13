import { z } from 'zod'
import { memberTierStatusSchema } from './member-tier'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'

export const memberPhoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{8}$/, '請輸入正確的手機號碼格式（09 開頭共 10 碼數字）')

export const memberBirthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入正確的日期格式（YYYY-MM-DD）')

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  points: z.number().int().nonnegative(),
  birthday: z.string().nullable(),
  tags: z.array(z.string().min(1)),
  notes: z.string().nullable(),
  createdAt: z.string(),
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

export const listMembersQuerySchema = paginationQuerySchema.extend({
  phone: z.string().min(1).optional(),
  q: z.string().trim().min(1).optional()
})
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>

export const memberListResponseSchema = createPaginatedResponseSchema(memberSchema)
export type MemberListResponse = z.infer<typeof memberListResponseSchema>

export const memberOrderSummarySchema = z.object({
  orderId: z.string(),
  orderTime: z.string(),
  orderStatus: z.string(),
  orderPaymentPrice: z.number().int().nonnegative(),
  pointsEarned: z.number().int()
})
export type MemberOrderSummary = z.infer<typeof memberOrderSummarySchema>

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

export const manualPointAdjustmentRequestSchema = z.object({
  delta: z.number().int().refine((value) => value !== 0, '調整量不能是 0'),
  reason: z.string().trim().min(1, '請說明調整原因'),
  operator: z.string().trim().min(1)
})
export type ManualPointAdjustmentRequest = z.infer<typeof manualPointAdjustmentRequestSchema>

export const memberDetailQuerySchema = paginationQuerySchema
export type MemberDetailQuery = z.infer<typeof memberDetailQuerySchema>

export const memberDetailSchema = memberSchema.extend({
  orders: createPaginatedResponseSchema(memberOrderSummarySchema),
  pointsLedger: z.array(memberPointLedgerEntrySchema)
})
export type MemberDetail = z.infer<typeof memberDetailSchema>

export const memberTierDistributionEntrySchema = z.object({
  tierId: z.string().nullable(),
  tierName: z.string(),
  memberCount: z.number().int().nonnegative()
})
export type MemberTierDistributionEntry = z.infer<typeof memberTierDistributionEntrySchema>

export const memberAnalyticsSchema = z.object({
  totalMembers: z.number().int().nonnegative(),
  newMembersThisMonth: z.number().int().nonnegative(),
  memberRevenue: z.number().int().nonnegative(),
  totalRevenue: z.number().int().nonnegative(),
  tierDistribution: z.array(memberTierDistributionEntrySchema)
})
export type MemberAnalytics = z.infer<typeof memberAnalyticsSchema>
