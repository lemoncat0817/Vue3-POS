import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createAppRouter } from './index'
import { useLoginStore } from '@/stores/login'
import { usePageStore } from '@/stores/page'
import type { AuthorityKey, StaffMember } from '@/types'

/**
 * P7（D-11／D-12）：驗證通用化後的導航守衛。
 *
 * - D-11：權限檢查改成通用讀 to.meta.capability（見 routes.ts），這裡
 *   驗證「有對應權限放行、沒有對應權限擋下並提示錯誤」對任何受保護路由
 *   都成立，不用再為每個路由各寫一段幾乎一樣的測試。
 * - D-12：還原上次瀏覽頁籤改成由 router.afterEach 自動寫入
 *   pageStore.lastVisitedName、由 beforeEach 在「應用程式剛啟動」時讀回
 *   （見 router/index.ts），這裡驗證這個自動同步真的取代了原本手動維護
 *   的數字狀態。
 *
 * 每個測試都用 createAppRouter() 拿一個全新、還沒有任何導航紀錄的
 * router 實例——D-12 的「應用程式剛啟動」判斷依賴 vue-router 內部的
 * 「這是第一次導航」狀態，共用同一個實例會讓這個條件只在第一個測試
 * 案例成立。
 */

const ALL_CAPABILITIES: AuthorityKey[] = [
  'canFreeDrink', 'canOpenCashier', 'canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder',
  'canCheckBackgroundSetting', 'canSetDrinkType', 'canSetDrink', 'canSetIngredients',
  'canSetMoneyDiscount', 'canSetPercentDiscount', 'canSetOftenUseDiscount',
  'canCheckDataAnalysis', 'canCheckAuthority', 'canSetAuthority', 'canSetPayMethod', 'canCheckMembers',
  'canManageTables',
]

// D-10 修復：StaffMember 只剩 authorityCheckList 這一份權限來源（見
// types/staff.ts 的說明），overrides 直接表達「這個權限有沒有」，不再
// 是先組一份 'O'/'X' 欄位再跟陣列一起塞進物件。
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

  it('D-11：沒有對應權限時，受保護路由會被擋下並提示錯誤', async () => {
    const { showToast } = await import('@/composables/useToast')
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckDataAnalysis: false })

    await router.push('/dataAnalysis')
    expect(router.currentRoute.value.path).not.toBe('/dataAnalysis')
    expect(showToast).toHaveBeenCalledWith('您沒有權限訪問該頁面, 請聯繫管理員', 'error')
  })

  it('D-11：有對應權限時可以正常進入受保護路由', async () => {
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckAuthority: true })

    await router.push('/authorityManagement')
    expect(router.currentRoute.value.path).toBe('/authorityManagement')
  })

  it('D-12：一般導航會自動記住目前路由名稱，不用呼叫端手動同步', async () => {
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff()

    await router.push('/backgroundSetting')
    expect(usePageStore().lastVisitedName).toBe('backgroundSetting')
  })

  it('D-12：應用程式剛啟動、落在首頁時，會還原成上次記住的頁籤', async () => {
    usePageStore().lastVisitedName = 'order'
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff()

    await router.push('/home')
    expect(router.currentRoute.value.path).toBe('/order')
  })

  it('D-12：還原上次頁籤時，目的地權限不足一樣會被擋下', async () => {
    usePageStore().lastVisitedName = 'authorityManagement'
    const router = createAppRouter()
    const loginStore = useLoginStore()
    loginStore.isLogin = true
    loginStore.userInfo = buildStaff({ canCheckAuthority: false })

    await router.push('/home')
    expect(router.currentRoute.value.path).not.toBe('/authorityManagement')
  })
})
