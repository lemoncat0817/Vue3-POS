import type { FormNumeric } from './common'

export type AuthorityKey =
  | 'canCompItem'
  | 'canOpenCashier'
  | 'canManageShift'
  | 'canCheckOrder'
  | 'canEditOrderStatus'
  | 'canDeleteOrder'
  | 'canRefundOrVoid'
  | 'canCheckBackgroundSetting'
  | 'canSetCategory'
  | 'canSetProduct'
  | 'canSetOrderCoupon'
  | 'canSetQuickDiscount'
  | 'canCheckDataAnalysis'
  | 'canCheckAuthority'
  | 'canManageStaff'
  | 'canManageRoles'
  | 'canSetPayMethod'
  | 'canCheckMembers'
  | 'canManageMembers'
  | 'canManageTables'
  | 'canSetBusinessHours'
  | 'canManageDevices'
  | 'canCheckAuditLog'

export interface StaffMember {
  id: FormNumeric
  name: string
  jobTitle: string
  account: string
  roleId: string
  roleName: string
  authorityCheckList: AuthorityKey[]
}
