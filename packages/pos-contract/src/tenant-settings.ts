import { z } from 'zod'

/** 租戶層級的營業設定：換日時間、會員點數比例。 */
export const tenantSettingsSchema = z.object({
  /** 營業日換日時間（0~23 時鐘小時）。凌晨營業到這個時間之前的訂單仍歸屬前一個營業日。 */
  businessDayStartHour: z.number().int().min(0).max(23),
  /** 每消費多少元累加 1 點（正整數）。 */
  pointsPerCurrencyUnit: z.number().int().positive()
})
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

/**
 * 更新請求採部分更新：兩個欄位分屬不同權限（換日時間需要 canSetBusinessHours、
 * 點數比例需要 canManageMembers），同一個 PUT 端點依請求內容動態檢查所需權限
 * （見 routes/tenant-settings.ts），不能用靜態 requireCapability() middleware。
 */
export const updateTenantSettingsRequestSchema = tenantSettingsSchema.partial()
export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>
