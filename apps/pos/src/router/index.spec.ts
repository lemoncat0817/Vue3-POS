import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createAppRouter } from './index'
import { useLoginStore } from '@/stores/login'
import { usePageStore } from '@/stores/page'
import type { AuthorityKey, StaffMember } from '@/types'

// 驗證通用導航守衛（權限檢查與初次載入頁籤還原）。

const ALL_CAPABILITIES: AuthorityKey[] = [
  'canCompItem', 'canOpenCashier', 'canManageShift', 'canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder', 'canRefundOrVoid',
  'canCheckBackgroundSetting', 'canSetCategory', 'canSetProduct', 'canSetAddOns',
  'canSetOrderCoupon', 'canSetQuickDiscount',
  'canCheckDataAnalysis', 'canCheckAuthority', 'canManageStaff', 'canManageRoles', 'canSetPayMethod', 'canCheckMembers',
  'canManageTables',
]

// 建立帶有指定權限清單的測試店員資料。
function buildStaff(overrides: Partial<Record<AuthorityKey, boolean>> = {}): StaffMember {
  const authorityCheckList = ALL_CAPABILITIES.filter((key) => overrides[key] ?? true)
  return {
    id: 1,
    name: '測試店員',
    jobTitle: '店長',
    account: 'tester',
    password: '',
    authorityCheckList,
  }
}

vi.mock('@/composables/useToast', () => ({
  showToast: vi.fn(),
}))

describe('router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('未登入時，除了登入頁以外一律導去 /login', async () => {
    const router = createAppRouter()
    useLoginStore().isLogin = false

    await router.push('/order')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('已登入時造訪登入頁會被導回首頁', async () => {
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff()

    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/home')
  })

  it('沒有對應權限時，受保護路由會被擋下並提示錯誤', async () => {
    const { showToast } = await import('@/composables/useToast')
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckDataAnalysis: false })

    await router.push('/dataAnalysis')
    expect(router.currentRoute.value.path).not.toBe('/dataAnalysis')
    expect(showToast).toHaveBeenCalledWith('您沒有權限訪問該頁面, 請聯繫管理員', 'error')
  })

  it('有對應權限時可以正常進入受保護路由', async () => {
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckAuthority: true })

    await router.push('/authorityManagement')
    expect(router.currentRoute.value.path).toBe('/authorityManagement')
  })

  it('一般導航會自動記住目前路由名稱，不用呼叫端手動同步', async () => {
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff()

    await router.push('/backgroundSetting')
    expect(usePageStore().lastVisitedName).toBe('backgroundSetting')
  })

  it('應用程式剛啟動、落在首頁時，會還原成上次記住的頁籤', async () => {
    usePageStore().lastVisitedName = 'order'
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff()

    await router.push('/home')
    expect(router.currentRoute.value.path).toBe('/order')
  })

  it('還原上次頁籤時，目的地權限不足一樣會被擋下', async () => {
    usePageStore().lastVisitedName = 'authorityManagement'
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckAuthority: false })

    await router.push('/home')
    expect(router.currentRoute.value.path).not.toBe('/authorityManagement')
  })
})
