import type { FormNumeric } from './common'

/** 權限能力鍵值——與 `authorityCheckList` 陣列的元素一一對應。 */
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
  | 'canCheckMembers'

/**
 * 員工資料。
 *
 * D-10 修復：權限曾經同時存在兩份來源——`authorityCheckList`（陣列）
 * 與 16 個獨立的 `'O'/'X'` 欄位，兩份各自要手動同步，寫入端（permission
 * Management 頁面的新增／編輯）曾經需要 16 行「從陣列算出對應欄位」
 * 的樣板程式碼，只要漏改一行、或忘記幫新的權限鍵補上對應欄位，兩份
 * 資料就會悄悄分岔。現在只留 `authorityCheckList` 這一份來源——判斷
 * 「這個人有沒有某個權限」一律用 @/utils/selection 的 hasCapability()
 * 查這個陣列，不要再另外加欄位。
 */
export interface StaffMember {
  id: FormNumeric
  name: string
  jobTitle: string
  account: string
  password: string
  authorityCheckList: AuthorityKey[]
}
