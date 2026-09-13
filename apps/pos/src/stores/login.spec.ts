import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLoginStore } from './login'
import * as httpModule from '@/api/http'
import { nextTick } from 'vue'

describe('useLoginStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('預設未登入狀態與預設欄位值', () => {
    const store = useLoginStore()
    expect(store.account).toBe('')
    expect(store.pin).toBe('')
    expect(store.isLogin).toBe(false)
    expect(store.userInfo).toEqual([])
    expect(store.rememberAccount).toBe(false)
    expect(store.sessionToken).toBeNull()
  })

  it('更新 sessionToken 會連動呼叫 http.ts 的 setOperatorSession', async () => {
    const setSpy = vi.spyOn(httpModule, 'setOperatorSession')
    const store = useLoginStore()
    store.sessionToken = 'test-operator-session-token'
    await nextTick()

    expect(setSpy).toHaveBeenCalledWith('test-operator-session-token')

    store.sessionToken = null
    await nextTick()
    expect(setSpy).toHaveBeenCalledWith(null)
  })

  it('登入後設定 userInfo 與 isLogin', () => {
    const store = useLoginStore()
    store.account = 'lemon'
    store.isLogin = true
    store.userInfo = {
      id: 'staff-1',
      name: 'Lemon',
      account: 'lemon',
      jobTitle: '店長',
      roleId: 'role-1',
      authorityCheckList: ['canCheckout']
    }

    expect(store.isLogin).toBe(true)
    expect(store.userInfo).toMatchObject({ name: 'Lemon', jobTitle: '店長' })
  })
})
