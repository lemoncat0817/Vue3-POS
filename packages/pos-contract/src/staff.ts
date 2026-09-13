import { z } from 'zod'

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

export const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN 必須是 4 到 6 碼數字')

export const createStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema
})
export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>

export const updateStaffRequestSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  account: z.string().min(1),
  roleId: z.string().min(1),
  pin: pinSchema.optional()
})
export type UpdateStaffRequest = z.infer<typeof updateStaffRequestSchema>

export const operatorLoginRequestSchema = z.object({
  account: z.string().min(1),
  pin: z.string().min(1)
})
export type OperatorLoginRequest = z.infer<typeof operatorLoginRequestSchema>

export const operatorLoginResponseSchema = staffSchema.extend({ sessionToken: z.string().min(1) })
export type OperatorLoginResponse = z.infer<typeof operatorLoginResponseSchema>
