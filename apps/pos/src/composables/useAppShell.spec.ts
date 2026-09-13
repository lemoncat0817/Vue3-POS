import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { navItems, useAppShell } from './useAppShell'
import { useCatalogStore } from '@/stores/catalog'
import { useLoginStore } from '@/stores/login'
import { useDeviceStore } from '@/stores/device'
import * as confirmModule from './useConfirm'
import * as authApi from '@/api/auth'
import type { CartLineItem, StaffMember } from '@/types'

const mockPush = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush
    })
  }
})

describe('useAppShell composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPush.mockReset().mockResolvedValue(undefined)
  })

  it('navItems 包含點餐、訂單、後台設定等必要路徑', () => {
    const paths = navItems.map((item) => item.path)
    expect(paths).toContain('/home')
    expect(paths).toContain('/order')
    expect(paths).toContain('/backgroundSetting')
  })

  it('cashierDisplayName 與 deviceDisplayName 依 store 正確計算', () => {
    const shell = useAppShell()
    const loginStore = useLoginStore()
    const deviceStore = useDeviceStore()

    // 預設未登入與未命名機台
    expect(shell.cashierDisplayName.value).toBe('未登入')
    expect(shell.deviceDisplayName.value).toBe('未命名機台')

    // 設定登入者
    loginStore.userInfo = {
      id: 'staff-1',
      name: '小明',
      jobTitle: '櫃檯'
    } as unknown as StaffMember
    expect(shell.cashierDisplayName.value).toBe('櫃檯 - 小明')

    // 設定機台名稱
    deviceStore.deviceName = '二號機'
    expect(shell.deviceDisplayName.value).toBe('二號機')
  })

  it('changePage() 購物車有品項欲前往後台時會觸發確認對話框', async () => {
    const shell = useAppShell()
    const catalogStore = useCatalogStore()
    catalogStore.cartLines = [{ id: 1, name: '測試' } as unknown as CartLineItem]

    const confirmSpy = vi.spyOn(confirmModule, 'confirm').mockResolvedValue('confirm')
    await shell.changePage('/backgroundSetting')

    expect(confirmSpy).toHaveBeenCalled()
    expect(catalogStore.cartLines).toHaveLength(0)
    expect(mockPush).toHaveBeenCalledWith('/backgroundSetting')
  })

  it('logout() 在確認後撤銷 session 並重設登入狀態', async () => {
    const shell = useAppShell()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.sessionToken = 'token-123'
    loginStore.account = 'admin'
    loginStore.rememberAccount = false

    vi.spyOn(confirmModule, 'confirm').mockResolvedValue('confirm')
    const revokeSpy = vi.spyOn(authApi, 'revokeSession').mockResolvedValue(undefined)

    await shell.logout()

    expect(revokeSpy).toHaveBeenCalledWith('token-123')
    expect(loginStore.isLogin).toBe(false)
    expect(loginStore.sessionToken).toBeNull()
    expect(loginStore.account).toBe('')
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
