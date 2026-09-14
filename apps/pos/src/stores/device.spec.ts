import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { primeDeviceTokenFromStorage, useDeviceStore } from './device'
import * as httpModule from '@/api/http'
import { nextTick } from 'vue'

describe('useDeviceStore & primeDeviceTokenFromStorage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('primeDeviceTokenFromStorage() 從 localStorage 讀取憑證並同步至 http.ts', () => {
    localStorage.setItem('device', JSON.stringify({ deviceToken: 'stored-token-xyz' }))
    primeDeviceTokenFromStorage()
    expect(httpModule.getDeviceToken()).toBe('stored-token-xyz')
  })

  it('primeDeviceTokenFromStorage() 在 localStorage 為空或損毀時不拋出例外', () => {
    localStorage.setItem('device', 'invalid-json{{{')
    expect(() => primeDeviceTokenFromStorage()).not.toThrow()
  })

  it('useDeviceStore 初始預設值', () => {
    const store = useDeviceStore()
    expect(store.deviceToken).toBeNull()
    expect(store.deviceName).toBeNull()
    expect(store.pendingOwnerAccount).toBeNull()
    expect(store.pendingOwnerPin).toBeNull()
    expect(store.webSessionToken).toBeNull()
    expect(store.justAuthenticatedViaOAuth).toBe(false)
  })

  it('deviceToken 與 webSessionToken 變更時同步至 http.ts', async () => {
    const devSpy = vi.spyOn(httpModule, 'setDeviceToken')
    const webSpy = vi.spyOn(httpModule, 'setWebSessionToken')

    const store = useDeviceStore()
    store.deviceToken = 'dev-token-abc'
    store.webSessionToken = 'web-session-123'
    await nextTick()

    expect(devSpy).toHaveBeenCalledWith('dev-token-abc')
    expect(webSpy).toHaveBeenCalledWith('web-session-123')
  })

  it('clearPendingOwnerCredentials() 與 hydrateDeviceNameFromServer() 正常運作', () => {
    const store = useDeviceStore()
    store.pendingOwnerAccount = 'owner'
    store.pendingOwnerPin = '1234'
    store.clearPendingOwnerCredentials()
    expect(store.pendingOwnerAccount).toBeNull()
    expect(store.pendingOwnerPin).toBeNull()

    store.hydrateDeviceNameFromServer('外帶專用機')
    expect(store.deviceName).toBe('外帶專用機')
  })
})
