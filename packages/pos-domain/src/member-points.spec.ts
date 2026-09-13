import { describe, expect, it } from 'vitest'
import { earnedPointsForPayment, pointsWithheldForRefundedAmount } from './member-points'

describe('earnedPointsForPayment', () => {
  it('每消費 10 元累加 1 點，無條件捨去', () => {
    expect(earnedPointsForPayment(160, 10)).toBe(16)
    expect(earnedPointsForPayment(165, 10)).toBe(16)
  })

  it('比例改成 5 元 1 點時，同樣金額累加的點數變多', () => {
    expect(earnedPointsForPayment(160, 5)).toBe(32)
  })

  it('比例不合法（0 或負數）時不累加，避免除以 0', () => {
    expect(earnedPointsForPayment(160, 0)).toBe(0)
    expect(earnedPointsForPayment(160, -1)).toBe(0)
  })
})

describe('pointsWithheldForRefundedAmount', () => {
  it('整單退款時，收回原本累加的全部點數', () => {
    expect(pointsWithheldForRefundedAmount(16, 160, 160)).toBe(16)
  })

  it('退一半金額時，收回一半點數', () => {
    expect(pointsWithheldForRefundedAmount(16, 160, 80)).toBe(8)
  })

  it('沒有退款時不收回點數', () => {
    expect(pointsWithheldForRefundedAmount(16, 160, 0)).toBe(0)
  })

  it('應付金額為 0 時不計算（防止除以 0）', () => {
    expect(pointsWithheldForRefundedAmount(16, 0, 0)).toBe(0)
  })
})
