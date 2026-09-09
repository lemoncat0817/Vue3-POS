import { z } from 'zod'

/** 權限能力鍵值。以單一陣列管理，取代舊版獨立布林欄位與重複清單。 */
export const authorityKeySchema = z.enum([
  'canCompItem',
  'canOpenCashier',
  'canCheckOrder',
  'canEditOrderStatus',
  'canDeleteOrder',
  'canCheckBackgroundSetting',
  'canSetCategory',
  'canSetProduct',
  'canSetAddOns',
  'canSetOrderCoupon',
  'canSetQuickDiscount',
  'canCheckDataAnalysis',
  'canCheckAuthority',
  'canSetAuthority',
  'canSetPayMethod',
  'canCheckMembers',
  'canManageTables',
])
export type AuthorityKey = z.infer<typeof authorityKeySchema>

/** 員工公開資料 schema。刻意不含 PIN/密碼等機敏欄位。 */
export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
})
export type Staff = z.infer<typeof staffSchema>

/** 操作員 PIN：4～6 碼數字，供實體終端機數字鍵盤輸入。 */
export const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN 必須是 4 到 6 碼數字')

export const createStaffRequestSchema = staffSchema.omit({ id: true }).extend({ pin: pinSchema })
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>

/** 編輯員工請求。pin 為選填，僅在變更時傳入以重新雜湊。 */
export const updateStaffRequestSchema = staffSchema.omit({ id: true }).extend({ pin: pinSchema.optional() })
export type UpdateStaffRequest = z.infer<typeof updateStaffRequestSchema>

/** 操作員登入請求。pin 格式不做限制，統一由業務層回傳 401 避免探測帳號存在與否。 */
export const operatorLoginRequestSchema = z.object({
  account: z.string().min(1),
  pin: z.string().min(1),
})
export type OperatorLoginRequest = z.infer<typeof operatorLoginRequestSchema>

export const operatorLoginResponseSchema = staffSchema
export type OperatorLoginResponse = z.infer<typeof operatorLoginResponseSchema>
