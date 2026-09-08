/**
 * 退款／作廢（重構規劃書 §10 P0「退款／作廢」）。
 *
 * 這個專案把「作廢」跟「退款」拆成兩件不同的事，不是同一個操作的
 * 兩種說法：
 *
 * - 作廢：訂單狀態改成「已取消」（見 @pos/contract 的 orderStatusSchema），
 *   代表這筆訂單整筆不算數——班別結算時完全排除這筆訂單的現金 tender
 *   （見 apps/api/src/routes/shifts.ts 的 sumCashSales），不需要另外
 *   記錄退了多少錢，因為它從一開始就沒被算進營業額。
 * - 退款：訂單狀態仍是「已完成」（商品可能已經拿走了、只是退部分或
 *   全部的錢），需要單獨記一筆退款紀錄（金額、原因、經手人），而且
 *   同一筆訂單可能分好幾次退款（例如先退一杯的錢，稍後才決定整單退）
 *   ——這是這裡需要 refundableAmount／isFullyRefunded 這組計算的原因：
 *   每次退款前都要重新算「這筆訂單還能退多少」，不能只看單次退款
 *   請求本身的金額是否合理。
 *
 * 純函式，只做金額計算，不管退款紀錄怎麼存、伺服端怎麼驗證——那些
 * 屬於 apps/api/src/routes/orders.ts 的責任。
 */

export interface RefundRecord {
  /** 這一筆退款的金額。 */
  amount: number
}

export interface OrderRefundSummary {
  /** 這筆訂單已經退掉的總額（所有退款紀錄的金額總和）。 */
  refundedAmount: number
  /** 這筆訂單目前還能退的金額：應付金額 − 已退金額。 */
  refundableAmount: number
  /** 已退金額達到應付金額，代表這筆訂單已經整單退完。 */
  isFullyRefunded: boolean
}

export function summarizeOrderRefunds(orderPaymentPrice: number, refunds: readonly RefundRecord[]): OrderRefundSummary {
  const refundedAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0)
  const refundableAmount = Math.max(0, orderPaymentPrice - refundedAmount)
  return {
    refundedAmount,
    refundableAmount,
    isFullyRefunded: refundableAmount === 0,
  }
}
