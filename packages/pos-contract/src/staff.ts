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
  'canSetOrderCoupon',
  'canSetQuickDiscount',
  'canCheckDataAnalysis',
  'canCheckAuthority',
  'canManageStaff',
  'canManageRoles',
  'canSetPayMethod',
  'canCheckMembers',
  'canManageMembers',
  'canManageTables',
  'canSetBusinessHours',
  'canManageDevices',
  'canCheckAuditLog'
])
export type AuthorityKey = z.infer<typeof authorityKeySchema>

/**
 * 權限鍵值的中文顯示名稱。前端權限勾選清單（utils/authority.ts）與後端組操作
 * 紀錄文字（routes/roles.ts）共用同一份，避免各自維護導致顯示文案兜不起來。
 */
export const AUTHORITY_KEY_LABELS: Record<AuthorityKey, string> = {
  canCompItem: '招待',
  canOpenCashier: '開收銀機',
  canManageShift: '管理班別／現金',
  canCheckOrder: '查看訂單',
  canEditOrderStatus: '編輯訂單狀態',
  canDeleteOrder: '刪除訂單',
  canRefundOrVoid: '退款／作廢',
  canCheckBackgroundSetting: '查看後台設定',
  canSetCategory: '設定分類',
  canSetProduct: '設定品項',
  canSetOrderCoupon: '設定訂單折價券',
  canSetQuickDiscount: '設定快速折扣',
  canSetPayMethod: '設定付款方式',
  canSetBusinessHours: '設定營業日換日時間',
  canCheckDataAnalysis: '查看數據分析',
  canCheckAuthority: '查看權限管理',
  canManageStaff: '設定人員名單',
  canManageRoles: '設定權限群組',
  canCheckMembers: '查看會員管理',
  canManageMembers: '新增／編輯／刪除會員',
  canManageTables: '查看桌況管理',
  canManageDevices: '管理裝置憑證',
  canCheckAuditLog: '查看操作紀錄'
}

/** 權限群組（角色）。isSystem 標記系統內建範本，不可刪除／改名，但權限內容仍可調整。 */
export const roleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  capabilities: z.array(authorityKeySchema),
  isSystem: z.boolean()
})
export type Role = z.infer<typeof roleSchema>

export const createRoleRequestSchema = z.object({
  name: z.string().min(1),
  capabilities: z.array(authorityKeySchema)
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
  capabilities: z.array(authorityKeySchema)
})
export type Staff = z.infer<typeof staffSchema>

/** 操作員 PIN：4～6 碼數字，供實體終端機數字鍵盤輸入。 */
export const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN 必須是 4 到 6 碼數字')

export const createStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema
})
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>

/** 編輯員工請求。pin 為選填，僅在變更時傳入以重新雜湊。 */
export const updateStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema.optional()
})
export type UpdateStaffRequest = z.infer<typeof updateStaffRequestSchema>

/** 操作員登入請求。pin 格式不做限制，統一由業務層回傳 401 避免探測帳號存在與否。 */
export const operatorLoginRequestSchema = z.object({
  account: z.string().min(1),
  pin: z.string().min(1)
})
export type OperatorLoginRequest = z.infer<typeof operatorLoginRequestSchema>

/**
 * sessionToken 是這次登入核發的操作員 session 明碼，只在這個回應裡出現一次
 * （之後伺服端只存雜湊值，見 db/schema.ts 的 operatorSessions）。後續寫入
 * 請求要帶著它當 X-Operator-Session，不能再直接送 staffId 冒充身分
 * ——staffId 本身是 GET /api/staff 就查得到的公開資訊。
 */
export const operatorLoginResponseSchema = staffSchema.extend({ sessionToken: z.string().min(1) })
export type OperatorLoginResponse = z.infer<typeof operatorLoginResponseSchema>
