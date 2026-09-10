import { z } from 'zod'

/** 權限能力鍵值。以單一陣列管理，取代舊版獨立布林欄位與重複清單。 */
export const authorityKeySchema = z.enum([
  'canCompItem',
  'canOpenCashier',
  'canManageShift',
  'canCheckOrder',
  'canEditOrderStatus',
  'canDeleteOrder',
  'canRefundOrVoid',
  'canCheckBackgroundSetting',
  'canSetCategory',
  'canSetProduct',
  'canSetAddOns',
  'canSetOrderCoupon',
  'canSetQuickDiscount',
  'canCheckDataAnalysis',
  'canCheckAuthority',
  'canManageStaff',
  'canManageRoles',
  'canSetPayMethod',
  'canCheckMembers',
  'canManageTables',
])
export type AuthorityKey = z.infer<typeof authorityKeySchema>

/** 權限群組（角色）。isSystem 標記系統內建範本，不可刪除／改名，但權限內容仍可調整。 */
export const roleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
  isSystem: z.boolean(),
})
export type Role = z.infer<typeof roleSchema>

export const createRoleRequestSchema = z.object({
  name: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
})
export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>

export const updateRoleRequestSchema = createRoleRequestSchema
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>

/**
 * 員工公開資料 schema。刻意不含 PIN/密碼等機敏欄位。
 * 權限只存在角色身上（roleId 是唯一來源）；roleName／capabilities 是伺服端
 * 依 roleId 解析出的結果，方便前端直接判斷權限而不必每次都另外查角色。
 */
export const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  roleName: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
})
export type Staff = z.infer<typeof staffSchema>

/** 操作員 PIN：4～6 碼數字，供實體終端機數字鍵盤輸入。 */
export const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN 必須是 4 到 6 碼數字')

export const createStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema,
})
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>

/** 編輯員工請求。pin 為選填，僅在變更時傳入以重新雜湊。 */
export const updateStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema.optional(),
})
export type UpdateStaffRequest = z.infer<typeof updateStaffRequestSchema>

/** 操作員登入請求。pin 格式不做限制，統一由業務層回傳 401 避免探測帳號存在與否。 */
export const operatorLoginRequestSchema = z.object({
  account: z.string().min(1),
  pin: z.string().min(1),
})
export type OperatorLoginRequest = z.infer<typeof operatorLoginRequestSchema>

export const operatorLoginResponseSchema = staffSchema
export type OperatorLoginResponse = z.infer<typeof operatorLoginResponseSchema>
