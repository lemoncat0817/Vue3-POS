import { describe, expect, it } from 'vitest'
import { summarizeOrderRefunds } from './refund'

describe('summarizeOrderRefunds', () => {
  it('沒有任何退款紀錄時，可退金額等於應付金額', () => {
    const result = summarizeOrderRefunds(300, [])
    expect(result).toEqual({ refundedAmount: 0, refundableAmount: 300, isFullyRefunded: false })
  })

  it('部分退款後，可退金額是應付金額扣掉已退金額', () => {
    const result = summarizeOrderRefunds(300, [{ amount: 100 }])
    expect(result).toEqual({ refundedAmount: 100, refundableAmount: 200, isFullyRefunded: false })
  })

  it('多筆退款紀錄的金額會加總', () => {
    const result = summarizeOrderRefunds(300, [{ amount: 100 }, { amount: 50 }])
    expect(result).toEqual({ refundedAmount: 150, refundableAmount: 150, isFullyRefunded: false })
  })

  it('退款金額剛好等於應付金額時，視為整單退完', () => {
    const result = summarizeOrderRefunds(300, [{ amount: 300 }])
    expect(result).toEqual({ refundedAmount: 300, refundableAmount: 0, isFullyRefunded: true })
  })

  it('可退金額不會是負數（防禦性下限，正常流程不該退超過應付金額）', () => {
    const result = summarizeOrderRefunds(300, [{ amount: 200 }, { amount: 200 }])
    expect(result).toEqual({ refundedAmount: 400, refundableAmount: 0, isFullyRefunded: true })
  })
})
