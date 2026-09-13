import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Coffee,
  Receipt,
  Settings,
  BarChart3,
  ShieldCheck,
  Users,
  LayoutGrid,
  History
} from 'lucide-vue-next'
import { revokeSession } from '@/api/auth'
import { useCatalogStore } from '@/stores/catalog'
import { useLoginStore } from '@/stores/login'
import { useDeviceStore } from '@/stores/device'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import { syncStatus } from '@/offline/sync-worker'
import { fromSelection } from '@/utils/selection'

/** 導覽項目、頁面切換、登出與主題切換共用邏輯。 */
export const navItems = [
  { path: '/home', label: '點餐', icon: Coffee },
  { path: '/order', label: '查看訂單', icon: Receipt },
  { path: '/backgroundSetting', label: '後台設定', icon: Settings },
  { path: '/dataAnalysis', label: '數據分析', icon: BarChart3 },
  { path: '/authorityManagement', label: '權限管理', icon: ShieldCheck },
  { path: '/members', label: '會員管理', icon: Users },
  { path: '/tables', label: '桌況管理', icon: LayoutGrid },
  { path: '/auditLog', label: '操作紀錄', icon: History }
]

export function useAppShell() {
  const catalogStore = useCatalogStore()
  const loginStore = useLoginStore()
  const deviceStore = useDeviceStore()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const cashierDisplayName = computed(() => {
    const user = fromSelection(loginStore.userInfo)
    if (!user) return '未登入'
    return `${user.jobTitle} - ${user.name}`
  })

  // GET /devices/me 還沒回來、或這台裝置還沒被命名時的預設顯示文字。
  const deviceDisplayName = computed(() => deviceStore.deviceName ?? '未命名機台')

  const changePage = async (path: string) => {
    if (path === '/backgroundSetting' && catalogStore.cartLines.length != 0) {
      const result = await confirm({
        title: '警告',
        description: '前往後台設定頁面後將清空點餐頁面,是否要前往後台設定頁面?',
        confirmText: '確定前往',
        cancelText: '取消前往'
      })
      if (result !== 'confirm') {
        showToast('取消前往後台設定頁面', 'error')
        return
      }
      catalogStore.cartLines = []
    }
    router.push(path)
  }

  const logout = async () => {
    const result = await confirm({
      title: '警告',
      description: '是否要登出?',
      confirmText: '登出',
      cancelText: '取消登出'
    })
    if (result !== 'confirm') {
      showToast('操作取消', 'error')
      return
    }
    // 先撤銷伺服端的 session，讓這組 token 立刻失效，不是只清掉本機狀態
    // ——撤銷失敗（連不上伺服端）也不擋住登出，見 api/auth.ts 的說明。
    if (loginStore.sessionToken) {
      await revokeSession(loginStore.sessionToken).catch(() => undefined)
    }
    router.push('/login')
    loginStore.isLogin = false
    loginStore.userInfo = []
    loginStore.sessionToken = null
    // 登出時清空記憶體中的 PIN。
    loginStore.pin = ''
    if (loginStore.rememberAccount === false) {
      loginStore.account = ''
    }
    showToast('登出成功', 'success')
  }

  return {
    navItems,
    router,
    theme,
    toggleTheme,
    syncStatus,
    cashierDisplayName,
    deviceDisplayName,
    changePage,
    logout
  }
}
