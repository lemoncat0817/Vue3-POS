import type { FormNumeric } from './common'

/** 權限能力鍵值——與 `authorityCheckList` 陣列的元素一一對應。 */
export type AuthorityKey =
  | 'canCompItem'
  | 'canOpenCashier'
  | 'canCheckOrder'
  | 'canEditOrderStatus'
  | 'canDeleteOrder'
  | 'canCheckBackgroundSetting'
  | 'canSetCategory'
  | 'canSetProduct'
  | 'canSetAddOns'
  | 'canSetOrderCoupon'
  | 'canSetQuickDiscount'
  | 'canCheckDataAnalysis'
  | 'canCheckAuthority'
  | 'canSetAuthority'
  | 'canSetPayMethod'
  | 'canCheckMembers'
  | 'canManageTables'

/** 員工資料。權限統一由 `authorityCheckList` 維護，透過 `hasCapability()` 判斷。 */
export interface StaffMember {
  id: FormNumeric
  name: string
  jobTitle: string
  account: string
  password: string
  authorityCheckList: AuthorityKey[]
}
