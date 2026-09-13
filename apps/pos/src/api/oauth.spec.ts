import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { consumeOAuthCallback } from './oauth'
import { useDeviceStore } from '@/stores/device'

function setHash(hash: string) {
  window.history.replaceState(null, '', '/login' + hash)
}

describe('consumeOAuthCallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setHash('')
  })
  afterEach(() => {
    setHash('')
  })

  it('網址上沒有 fragment 時回傳 none，不動 deviceStore', () => {
    const deviceStore = useDeviceStore()
    const result = consumeOAuthCallback(deviceStore)
    expect(result).toEqual({ status: 'none' })
    expect(deviceStore.deviceToken).toBeNull()
  })

  it('登入成功（既有租戶）：寫入 deviceToken，不帶 owner 帳密，清掉網址上的 fragment', () => {
    setHash('#session=s-1&device=d-1&provider=google')
    const deviceStore = useDeviceStore()

    const result = consumeOAuthCallback(deviceStore)

    expect(result).toEqual({ status: 'success', provider: 'google', isNewTenant: false })
    expect(deviceStore.deviceToken).toBe('d-1')
    expect(deviceStore.webSessionToken).toBe('s-1')
    expect(deviceStore.pendingOwnerAccount).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('登入成功（新租戶）：一併寫入一次性的 owner 帳號／PIN', () => {
    setHash('#session=s-1&device=d-1&provider=github&ownerAccount=owner-abc123&ownerPin=4821')
    const deviceStore = useDeviceStore()

    const result = consumeOAuthCallback(deviceStore)

    expect(result).toEqual({ status: 'success', provider: 'github', isNewTenant: true })
    expect(deviceStore.deviceToken).toBe('d-1')
    expect(deviceStore.webSessionToken).toBe('s-1')
    expect(deviceStore.pendingOwnerAccount).toBe('owner-abc123')
    expect(deviceStore.pendingOwnerPin).toBe('4821')
  })

  it('登入失敗：回傳 error，不寫入 deviceToken，一樣清掉 fragment', () => {
    setHash('#error=google_login_failed')
    const deviceStore = useDeviceStore()

    const result = consumeOAuthCallback(deviceStore)

    expect(result).toEqual({ status: 'error', error: 'google_login_failed' })
    expect(deviceStore.deviceToken).toBeNull()
    expect(window.location.hash).toBe('')
  })

  it('清掉 fragment 後保留原本的 path，不會把使用者導去別的頁面', () => {
    setHash('#session=s-1&device=d-1&provider=google')
    consumeOAuthCallback(useDeviceStore())
    expect(window.location.pathname).toBe('/login')
  })
})
