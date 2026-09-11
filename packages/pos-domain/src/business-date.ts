/**
 * 營業日判定邏輯。以本地時間搭配自訂換日時間（預設 04:00）計算所屬營業日，
 * 避免 UTC 與本地時間差造成的跨日重複發號及跨夜營業歸屬問題。
 */

/** 預設營業日切換時間：本地時間 04:00。凌晨 00:00–04:00 的訂單仍歸屬前一個營業日。 */
export const DEFAULT_BUSINESS_DAY_START_HOUR = 4

/** 計算某個時間點所屬的營業日（本地時間 YYYYMMDD 格式）。 */
export function getBusinessDate(
  at: Date,
  startHour: number = DEFAULT_BUSINESS_DAY_START_HOUR
): string {
  const shifted = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  if (at.getHours() < startHour) {
    shifted.setDate(shifted.getDate() - 1)
  }
  const year = shifted.getFullYear()
  const month = String(shifted.getMonth() + 1).padStart(2, '0')
  const day = String(shifted.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}
