import { z } from 'zod'

/**
 * 會員分級門檻。業主自訂，依累積消費金額（排除已取消訂單）比對，取符合
 * 門檻中最高的一級——不存在會員身上，是即時算出來的，見
 * apps/api/src/routes/members.ts 的 resolveMemberTiers()。
 */
export const memberTierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  minSpend: z.number().int().nonnegative()
})
export type MemberTier = z.infer<typeof memberTierSchema>

export const createMemberTierRequestSchema = z.object({
  name: z.string().trim().min(1),
  minSpend: z.number().int().nonnegative()
})
export type CreateMemberTierRequest = z.infer<typeof createMemberTierRequestSchema>

export const updateMemberTierRequestSchema = createMemberTierRequestSchema
export type UpdateMemberTierRequest = z.infer<typeof updateMemberTierRequestSchema>

/** 會員目前的等級與累積消費，附在 memberSchema 上（見 member.ts）。沒有任何等級門檻達標時是 null。 */
export const memberTierStatusSchema = z.object({
  tier: memberTierSchema.nullable(),
  lifetimeSpend: z.number().int().nonnegative()
})
export type MemberTierStatus = z.infer<typeof memberTierStatusSchema>
