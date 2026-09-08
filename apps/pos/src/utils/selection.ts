import type { AuthorityKey } from '@/types'

/**
 * 部分畫面用空陣列 `[]` 代表「尚未選取」，而不是 `null`／`undefined`
 * （例如 `drinkStore.drinkItem`：未選擇茶類時是 `[]`，選擇後整個換成一筆
 * 完整的 `DrinkListItem`）。這個輔助函式把 `T | []` 安全地轉成
 * `T | undefined`，讓呼叫端能用一般的 `?.` 存取屬性——`Array.isArray([])`
 * 為真所以回傳 `undefined`，接上 `?.` 之後的結果與原本直接對空陣列取
 * 不存在的屬性（回傳 `undefined`）完全一致，不改變任何行為。
 */
export function fromSelection<T extends object>(value: T | undefined | []): T | undefined {
  return Array.isArray(value) ? undefined : value
}

/**
 * 判斷某個 `StaffMember | undefined | []`（`CurrentUser` 的實際形狀，
 * 見 stores/login.ts）是否擁有某個權限。
 *
 * D-10 修復：權限曾經同時存在 `authorityCheckList` 陣列與 16 個獨立
 * `'O'/'X'` 欄位兩份來源（見 types/staff.ts 的說明），呼叫端原本各自
 * 寫 `fromSelection(user)?.canXxx === 'O'`（或 `=== 'X'` 取反）散在
 * 十幾個檔案裡。現在只有 authorityCheckList 這一份來源，這個函式是
 * 唯一應該用來判斷權限的地方——不要再直接比較 `.canXxx` 欄位（那個
 * 欄位已經不存在了）。
 */
export function hasCapability<T extends { authorityCheckList: AuthorityKey[] }>(
  value: T | undefined | [],
  key: AuthorityKey,
): boolean {
  return fromSelection(value)?.authorityCheckList.includes(key) ?? false
}
