import { describe, expect, it } from 'vitest'
import {
  requestRefund,
  settleRefundPrompt,
  useRefundPromptState
} from './useRefund'

describe('useRefund composable', () => {
  it('requestRefund() 初始化退款上限金額與原因並等待確認', async () => {
    const promise = requestRefund({ max: 500 })

    const state = useRefundPromptState()
    expect(state.open).toBe(true)
    expect(state.max).toBe(500)
    expect(state.amount).toBe(500)

    settleRefundPrompt({ amount: 300, reason: '客戶要求部分退款' })
    const result = await promise
    expect(result).toEqual({ amount: 300, reason: '客戶要求部分退款' })
    expect(state.open).toBe(false)
  })

  it('取消時 settleRefundPrompt(null)', async () => {
    const promise = requestRefund({ max: 200 })
    settleRefundPrompt(null)
    expect(await promise).toBeNull()
  })
})
