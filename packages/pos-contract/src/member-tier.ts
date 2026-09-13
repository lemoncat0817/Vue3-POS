import { z } from 'zod'

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

export const memberTierStatusSchema = z.object({
  tier: memberTierSchema.nullable(),
  lifetimeSpend: z.number().int().nonnegative()
})
export type MemberTierStatus = z.infer<typeof memberTierStatusSchema>
