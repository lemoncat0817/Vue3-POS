import type { AuthorityKey } from '@/types'

/** 將部分畫面以空陣列 `[]` 代表「未選取」的值轉為 `T | undefined`，便於以 `?.` 存取。 */
export function fromSelection<T extends object>(value: T | undefined | []): T | undefined {
  return Array.isArray(value) ? undefined : value
}

/** 判斷使用者是否具備指定權限（以 `authorityCheckList` 為單一來源）。 */
export function hasCapability<T extends { authorityCheckList: AuthorityKey[] }>(
  value: T | undefined | [],
  key: AuthorityKey
): boolean {
  return fromSelection(value)?.authorityCheckList.includes(key) ?? false
}
