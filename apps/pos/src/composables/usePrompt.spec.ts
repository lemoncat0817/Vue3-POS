import { describe, expect, it } from 'vitest'
import { prompt, settlePrompt, usePromptState } from './usePrompt'

describe('usePrompt composable', () => {
  it('prompt() 開啟對話框並在 settlePrompt 時 resolve 輸入內容', async () => {
    const promise = prompt({
      title: '輸入桌號',
      label: '桌號',
      placeholder: '例如 A1'
    })

    const state = usePromptState()
    expect(state.open).toBe(true)
    expect(state.title).toBe('輸入桌號')
    expect(state.label).toBe('桌號')
    expect(state.placeholder).toBe('例如 A1')

    settlePrompt('B2')
    const result = await promise
    expect(result).toBe('B2')
    expect(state.open).toBe(false)
  })

  it('settlePrompt 傳入 null 代表取消', async () => {
    const promise = prompt({
      title: '測試取消',
      label: '備註'
    })

    settlePrompt(null)
    const result = await promise
    expect(result).toBeNull()
  })
})
