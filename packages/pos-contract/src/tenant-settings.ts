import { z } from 'zod'

export const tenantSettingsSchema = z.object({
  businessDayStartHour: z.number().int().min(0).max(23),
  pointsPerCurrencyUnit: z.number().int().positive(),
  pointsRedemptionRate: z.number().int().positive(),
  pointsExpiryMonths: z.number().int().positive().nullable(),
  autoOccupyTableOnCheckout: z.boolean()
})
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

export const updateTenantSettingsRequestSchema = tenantSettingsSchema.partial()
export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>
