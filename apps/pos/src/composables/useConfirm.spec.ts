import { describe, expect, it } from 'vitest'
import {
  alert,
  confirm,
  settleConfirm,
  useConfirmState
} from './useConfirm'

describe('useConfirm composable', () => {
  it('confirm() 能正確開啟狀態並在 settleConfirm 時 resolve 對應選擇', async () => {
    const promise = confirm({
      title: '刪除確認',
      description: '確定要刪除此項目？',
      confirmText: '刪除',
      variant: 'danger'
    })

    const state = useConfirmState()
    expect(state.open).toBe(true)
    expect(state.title).toBe('刪除確認')
    expect(state.description).toBe('確定要刪除此項目？')
    expect(state.confirmText).toBe('刪除')
    expect(state.variant).toBe('danger')

    settleConfirm('confirm')
    const result = await promise
    expect(result).toBe('confirm')
    expect(state.open).toBe(false)
  })

  it('settleConfirm 支援 cancel 與 dismiss', async () => {
    const p1 = confirm({ title: '取消測試' })
    settleConfirm('cancel')
    expect(await p1).toBe('cancel')

    const p2 = confirm({ title: '關閉測試' })
    settleConfirm('dismiss')
    expect(await p2).toBe('dismiss')
  })

  it('alert() 預設 singleButton 為 true 並回傳 Promise<void>', async () => {
    const promise = alert({
      title: '通知',
      description: '操作成功'
    })

    const state = useConfirmState()
    expect(state.open).toBe(true)
    expect(state.singleButton).toBe(true)

    settleConfirm('confirm')
    const result = await promise
    expect(result).toBeUndefined()
  })
})
