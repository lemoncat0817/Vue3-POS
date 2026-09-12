import type { FormNumeric } from './common'

/** 權限能力鍵值——與 `authorityCheckList` 陣列的元素一一對應。 */
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
  | 'canManageTables'

/**
 * 員工資料。權限只存在角色（權限群組）身上，員工只認 roleId；
 * authorityCheckList 是伺服端依 roleId 解析出的 capabilities 快照，
 * 供 `hasCapability()` 直接判斷，不必每次都另外查角色。
 */
export interface StaffMember {
  id: FormNumeric
  name: string
  jobTitle: string
  account: string
  roleId: string
  roleName: string
  authorityCheckList: AuthorityKey[]
}
