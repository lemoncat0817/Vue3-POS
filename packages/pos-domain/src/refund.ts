export interface RefundRecord {
  amount: number
}

export interface OrderRefundSummary {
  refundedAmount: number
  refundableAmount: number
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
