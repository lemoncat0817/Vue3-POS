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
