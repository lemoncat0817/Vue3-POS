import { z } from 'zod'

/** 租戶層級的營業設定：換日時間、會員點數比例、桌況自動連動開關。 */
export const tenantSettingsSchema = z.object({
  /** 營業日換日時間（0~23 時鐘小時）。凌晨營業到這個時間之前的訂單仍歸屬前一個營業日。 */
  businessDayStartHour: z.number().int().min(0).max(23),
  /** 每消費多少元累加 1 點（正整數）。 */
  pointsPerCurrencyUnit: z.number().int().positive(),
  /** 結帳折抵時，每多少點折抵 1 元（正整數）。跟 pointsPerCurrencyUnit 是相反方向的兩個比例，各自設定。 */
  pointsRedemptionRate: z.number().int().positive(),
  /** 會員連續幾個月沒有點數異動就整包歸零；null 代表沒有啟用，點數永久有效。 */
  pointsExpiryMonths: z.number().int().positive().nullable(),
  /** 內用結帳時是否自動把對應桌位標記為使用中，預設開啟。 */
  autoOccupyTableOnCheckout: z.boolean()
})
export type TenantSettings = z.infer<typeof tenantSettingsSchema>

/**
 * 更新請求採部分更新：各欄位分屬不同權限（換日時間需要 canSetBusinessHours、
 * 點數比例需要 canManageMembers、桌況自動連動開關需要 canManageTables），
 * 同一個端點依請求內容動態檢查所需權限（見 routes/tenant-settings.ts），
 * 不能用靜態 requireCapability() middleware。
 */
export const updateTenantSettingsRequestSchema = tenantSettingsSchema.partial()
export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>
