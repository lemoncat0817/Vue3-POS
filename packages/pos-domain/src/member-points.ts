export const DEFAULT_POINTS_PER_CURRENCY_UNIT = 10
export const DEFAULT_POINTS_REDEMPTION_RATE = 10

export function earnedPointsForPayment(
  orderPaymentPrice: number,
  pointsPerCurrencyUnit: number
): number {
  if (pointsPerCurrencyUnit <= 0) return 0
  return Math.floor(orderPaymentPrice / pointsPerCurrencyUnit)
}

export function redemptionValueForPoints(
  pointsToRedeem: number,
  pointsRedemptionRate: number
): number {
  if (pointsRedemptionRate <= 0 || pointsToRedeem <= 0) return 0
  return Math.floor(pointsToRedeem / pointsRedemptionRate)
}

// 依原始訂單實付比例反推退點，避免事後調整設定影響舊單
export function pointsWithheldForRefundedAmount(
  pointsEarned: number,
  orderPaymentPrice: number,
  refundedAmount: number
): number {
  if (orderPaymentPrice <= 0) return 0
  return Math.floor((pointsEarned * refundedAmount) / orderPaymentPrice)
}
