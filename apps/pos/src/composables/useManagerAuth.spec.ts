import { describe, expect, it } from 'vitest'
import {
  requestManagerAuth,
  settleManagerAuth,
  useManagerAuthState
} from './useManagerAuth'

describe('useManagerAuth composable', () => {
  it('requestManagerAuth() 彈出授權框並接收主管帳號密碼', async () => {
    const promise = requestManagerAuth({
      title: '作廢訂單二次授權',
      description: '請輸入主管 PIN 碼以執行作廢'
    })

    const state = useManagerAuthState()
    expect(state.open).toBe(true)
    expect(state.title).toBe('作廢訂單二次授權')
    expect(state.description).toBe('請輸入主管 PIN 碼以執行作廢')

    settleManagerAuth({ account: 'manager1', pin: '8888' })
    const result = await promise
    expect(result).toEqual({ account: 'manager1', pin: '8888' })
    expect(state.open).toBe(false)
  })

  it('取消時 settleManagerAuth(null)', async () => {
    const promise = requestManagerAuth({
      title: '測試取消',
      description: '說明'
    })

    settleManagerAuth(null)
    const result = await promise
    expect(result).toBeNull()
  })
})
