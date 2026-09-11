/**
 * 退款與作廢領域邏輯。作廢直接排除營收（狀態改為已取消）；退款保留已完成狀態並紀錄退款流水，可多次部分退款。
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

export function summarizeOrderRefunds(
  orderPaymentPrice: number,
  refunds: readonly RefundRecord[]
): OrderRefundSummary {
  const refundedAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0)
  const refundableAmount = Math.max(0, orderPaymentPrice - refundedAmount)
  return {
    refundedAmount,
    refundableAmount,
    isFullyRefunded: refundableAmount === 0
  }
}
