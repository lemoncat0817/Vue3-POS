/**
 * 會員點數計算邏輯。累加、退還都用同一套「金額 ÷ 比例」取整規則；退款／作廢
 * 反推應收回多少點時，用「原始應得點數 × 退款比例」而不是拿當下最新的比例
 * 重算——避免租戶事後調整比例，讓舊訂單的退點數字跟著跑掉。
 */

/** 沒有租戶自訂設定時的預設值：每消費 10 元累加 1 點。 */
export const DEFAULT_POINTS_PER_CURRENCY_UNIT = 10

/** 沒有租戶自訂設定時的預設值：每 10 點折抵 1 元。 */
export const DEFAULT_POINTS_REDEMPTION_RATE = 10

/** 依應付金額與比例算出這筆訂單應得的點數，無條件捨去。 */
export function earnedPointsForPayment(
  orderPaymentPrice: number,
  pointsPerCurrencyUnit: number
): number {
  if (pointsPerCurrencyUnit <= 0) return 0
  return Math.floor(orderPaymentPrice / pointsPerCurrencyUnit)
}

/** 依折抵比例算出要花掉的點數能折抵多少錢，無條件捨去（跟累加點數同一套「金額÷比例」邏輯，方向相反）。 */
export function redemptionValueForPoints(
  pointsToRedeem: number,
  pointsRedemptionRate: number
): number {
  if (pointsRedemptionRate <= 0 || pointsToRedeem <= 0) return 0
  return Math.floor(pointsToRedeem / pointsRedemptionRate)
}

/** 依「已退款金額佔應付金額」的比例，反推應該收回多少點數。 */
export function pointsWithheldForRefundedAmount(
  pointsEarned: number,
  orderPaymentPrice: number,
  refundedAmount: number
): number {
  if (orderPaymentPrice <= 0) return 0
  return Math.floor((pointsEarned * refundedAmount) / orderPaymentPrice)
}
