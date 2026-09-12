import { z } from 'zod'

/** 租戶層級的營業設定，目前只有營業日換日時間；未來若有其他店務層級參數可以加進來。 */
export const tenantSettingsSchema = z.object({
  /** 營業日換日時間（0~23 時鐘小時）。凌晨營業到這個時間之前的訂單仍歸屬前一個營業日。 */
  businessDayStartHour: z.number().int().min(0).max(23)
})
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

export const updateTenantSettingsRequestSchema = tenantSettingsSchema
export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>
