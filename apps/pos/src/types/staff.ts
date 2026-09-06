import type { FormNumeric, PermissionFlag } from './common'

/** 權限能力鍵值——與 `authorityCheckList` 陣列及 16 個 `'O'/'X'` 欄位一一對應。 */
export type AuthorityKey =
  | 'canFreeDrink'
  | 'canOpenCashier'
  | 'canCheckOrder'
  | 'canEditOrderStatus'
  | 'canDeleteOrder'
  | 'canCheckBackgroundSetting'
  | 'canSetDrinkType'
  | 'canSetDrink'
  | 'canSetIngredients'
  | 'canSetMoneyDiscount'
  | 'canSetPercentDiscount'
  | 'canSetOftenUseDiscount'
  | 'canCheckDataAnalysis'
  | 'canCheckAuthority'
  | 'canSetAuthority'
  | 'canSetPayMethod'

/**
 * 員工資料。權限同時存在兩份來源：`authorityCheckList`（陣列）與 16 個獨立
 * 的 `'O'/'X'` 欄位——這是目錄中的既有缺陷（D-10），P0 只如實建模、不合併。
 */
export interface StaffMember extends Record<AuthorityKey, PermissionFlag> {
  id: FormNumeric
  name: string
  jobTitle: string
  account: string
  password: string
  authorityCheckList: AuthorityKey[]
}
