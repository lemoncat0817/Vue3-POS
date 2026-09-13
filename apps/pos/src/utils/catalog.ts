import type { CartLineItem } from '@/types/catalog'

/** 加購清單的顯示字串：陣列以頓號串接，避免 Vue 對陣列的預設文字插值跑出
 * `JSON.stringify` 格式（畫面上會變成 `[ "布丁", "珍珠" ]` 這種看起來像沒處理過的原始資料）。 */
export function formatAddList(addList: CartLineItem['addList']): string {
  return Array.isArray(addList) ? addList.join('、') : addList
}
