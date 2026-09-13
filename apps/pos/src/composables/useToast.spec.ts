import { describe, expect, it } from 'vitest'
import { setToastOpen, showToast, useToastState } from './useToast'

describe('useToast composable', () => {
  it('showToast() 透過微任務開啟 Toast 並設定訊息與類型', async () => {
    showToast('儲存成功', 'success')
    await Promise.resolve()

    const state = useToastState()
    expect(state.open).toBe(true)
    expect(state.message).toBe('儲存成功')
    expect(state.type).toBe('success')
  })

  it('支援 error 類型 Toast', async () => {
    showToast('連線失敗', 'error')
    await Promise.resolve()

    const state = useToastState()
    expect(state.open).toBe(true)
    expect(state.message).toBe('連線失敗')
    expect(state.type).toBe('error')
  })

  it('setToastOpen() 可手動關閉 Toast', () => {
    const state = useToastState()
    setToastOpen(false)
    expect(state.open).toBe(false)
  })
})
