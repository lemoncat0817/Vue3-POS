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
} from 'lucide-vue-next'
import { useDrinkStore } from '@/stores/drink'
import { useLoginStore } from '@/stores/login'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import { syncStatus } from '@/offline/sync-worker'
import { fromSelection } from '@/utils/selection'

/**
 * UI-3（規劃書 §4.1「後台 Shell」）：主導覽、登出、主題切換這幾件事
 * 原本只活在 layout/header/index.vue 裡——只有一個地方用得到，沒有
 * 抽出來的必要。現在後台六個頁面（訂單／後台設定／數據分析／權限
 * 管理／會員管理／桌況管理）改用 layout/admin/ 底下的側邊欄 shell，
 * 跟點餐首頁的頂部列共用同一份導覽項目清單、同一套切換頁面／登出
 * 邏輯——抽成這個組合式函式，兩邊呼叫端各自決定要畫成橫向按鈕列
 * 還是縱向側邊欄，行為（含「切去後台設定會先清空點餐頁」這類副作用）
 * 保證一致，不會出現兩份邏輯各自維護、悄悄分岔的狀況。
 */
export const navItems = [
  { path: '/home', label: '點餐', icon: Coffee },
  { path: '/order', label: '查看訂單', icon: Receipt },
  { path: '/backgroundSetting', label: '後台設定', icon: Settings },
  { path: '/dataAnalysis', label: '數據分析', icon: BarChart3 },
  { path: '/authorityManagement', label: '權限管理', icon: ShieldCheck },
  { path: '/members', label: '會員管理', icon: Users },
  { path: '/tables', label: '桌況管理', icon: LayoutGrid },
]

export function useAppShell() {
  const drinkStore = useDrinkStore()
  const loginStore = useLoginStore()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const cashierDisplayName = computed(() => {
    const user = fromSelection(loginStore.userInfo)
    if (!user) return '未登入'
    return `${user.jobTitle} - ${user.name}`
  })

  // 切換頁面
  // P7（D-12）：原本這裡每個分支都要手動同步一份 pageStore.currentPage，
  // 現在「記住上次瀏覽頁籤」改由 router.afterEach 自動處理（見
  // router/index.ts、stores/page.ts），這裡只需要單純導航。
  const changePage = async (path: string) => {
    if (path === '/backgroundSetting' && drinkStore.drinkNotPay.length != 0) {
      const result = await confirm({
        title: '警告',
        description: '前往後台設定頁面後將清空點餐頁面,是否要前往後台設定頁面?',
        confirmText: '確定前往',
        cancelText: '取消前往',
      })
      if (result !== 'confirm') {
        showToast('取消前往後台設定頁面', 'error')
        return
      }
      drinkStore.drinkNotPay = []
    }
    router.push(path)
  }

  // 登出
  const logout = async () => {
    const result = await confirm({
      title: '警告',
      description: '是否要登出?',
      confirmText: '登出',
      cancelText: '取消登出',
    })
    if (result !== 'confirm') {
      showToast('操作取消', 'error')
      return
    }
    router.push('/login')
    loginStore.isLogin = false
    loginStore.userInfo = []
    // D-04 修復：pin 不管有沒有勾選「記住帳號」都要清空——它本來就不會
    // 被存進 localStorage（見 stores/login.ts 的 persist.omit 說明），
    // 這裡只是確保登出後記憶體裡也不留著上一位操作員的明碼 PIN，換下一
    // 個人登入時不會不小心看到或用到。帳號名稱才是「記住帳號」實際
    // 影響的欄位。
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
    changePage,
    logout,
  }
}
