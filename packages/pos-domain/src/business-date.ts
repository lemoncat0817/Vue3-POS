/**
 * 營業日判定（重構規劃書 §7，修復 D-03）。
 *
 * D-03 的根因有兩個：
 * 1. 換日判定用 `toISOString()`（UTC 日期），但訂單編號前綴用本地日期
 *    ——兩者相差 8 小時，換日時機因此落在台北時間 08:00，恰好是早班
 *    開店時間，提前開機測試單或早班提前開單會在同一本地日期內重複
 *    發號。
 * 2. 換日邊界用午夜（00:00），沒有考慮跨夜營業——凌晨的訂單理應歸屬
 *    前一個營業日，不該在午夜就重置訂單編號。
 *
 * 這裡以「營業日切換時間」取代午夜作為邊界，且全程使用本地時間、不
 * 依賴 `Date.prototype.toISOString()`。
 */

/** 預設營業日切換時間：本地時間 04:00。凌晨 00:00–04:00 的訂單仍歸屬前一個營業日。 */
export const DEFAULT_BUSINESS_DAY_START_HOUR = 4

/**
 * 計算某個時間點所屬的營業日，格式為 `YYYYMMDD`（本地時間），與現行
 * 訂單編號前綴的格式一致，只是判定邏輯改為正確的本地時間 + 營業日
 * 邊界。
 */
export function getBusinessDate(at: Date, startHour: number = DEFAULT_BUSINESS_DAY_START_HOUR): string {
  const shifted = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  if (at.getHours() < startHour) {
    shifted.setDate(shifted.getDate() - 1)
  }
  const year = shifted.getFullYear()
  const month = String(shifted.getMonth() + 1).padStart(2, '0')
  const day = String(shifted.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}
