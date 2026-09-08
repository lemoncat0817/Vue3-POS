<template>
  <header
    class="flex h-16 w-screen items-center gap-2 border-b border-surface-200 bg-white/95 px-4 backdrop-blur-md dark:border-surface-800 dark:bg-surface-950/95 shadow-sm transition-colors sticky top-0 z-40">
    <!-- 品牌識別 -->
    <div class="flex items-center gap-2.5 mr-2">
      <div class="hidden 2xl:flex flex-col">
        <span class="text-sm font-black tracking-tight text-surface-900 dark:text-surface-50 leading-none">POS</span>
        <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider">COMMERCIAL POS</span>
      </div>
    </div>

    <!-- 主導覽選單 -->
    <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      <button
        v-for="item in navItems" :key="item.path" type="button"
        class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs lg:text-sm font-bold transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :class="router.currentRoute.value.path === item.path
          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100'"
        @click="changePage(item.path)">
        <component :is="item.icon" class="h-4 w-4 shrink-0 opacity-90" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- 右側狀態與操作列 -->
    <div class="ml-auto flex items-center gap-2.5 shrink-0">
      <!-- 門市與值班收銀員徽章 -->
      <div class="hidden lg:flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-700 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 shadow-inner">
        <Store class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
        <span>旗艦店 · 機台 A</span>
        <span class="h-1 w-1 rounded-full bg-surface-300 dark:bg-surface-600"></span>
        <UserCheck class="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
        <span>{{ cashierDisplayName }}</span>
      </div>

      <!-- P3：離線送單佇列的同步狀態（見 src/offline/sync-worker.ts）。
           平常佇列是空的，不佔畫面；有東西還沒送達伺服端時才顯示。 -->
      <div
        v-if="syncStatus.pendingCount > 0" data-testid="sync-status"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold animate-pulse shadow-sm"
        :class="syncStatus.lastError ? 'bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300' : 'bg-info-100 text-info-800 dark:bg-info-950 dark:text-info-300'">
        <RefreshCw class="h-3 w-3 animate-spin shrink-0" />
        <span v-if="syncStatus.isSyncing">同步中</span>
        <span v-else-if="syncStatus.lastError">同步失敗，重試中</span>
        <span v-else>等待連線同步</span>
        <span>（{{ syncStatus.pendingCount }} 筆）</span>
      </div>

      <!-- 主題切換 -->
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors shadow-sm"
        :aria-label="theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'" @click="toggleTheme">
        <Sun v-if="theme === 'dark'" class="h-4 w-4 text-accent-400" />
        <Moon v-else class="h-4 w-4 text-surface-600" />
      </button>

      <!-- 登出按鈕 -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs lg:text-sm font-bold text-surface-700 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 dark:hover:border-danger-800 transition-all shadow-sm"
        @click="logout">
        <LogOut class="h-4 w-4 shrink-0" />
        <span>登出</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Coffee,
  Receipt,
  Settings,
  BarChart3,
  ShieldCheck,
  Users,
  LayoutGrid,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Store,
  UserCheck
} from 'lucide-vue-next'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import { useRouter } from "vue-router"
const router = useRouter()
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import { syncStatus } from '@/offline/sync-worker'
import { fromSelection } from '@/utils/selection'

const { theme, toggleTheme } = useTheme()

const cashierDisplayName = computed(() => {
  const user = fromSelection(loginStore.userInfo)
  if (!user) return '未登入'
  return `${user.jobTitle} - ${user.name}`
})

const navItems = [
  { path: '/home', label: '點餐', icon: Coffee },
  { path: '/order', label: '查看訂單', icon: Receipt },
  { path: '/backgroundSetting', label: '後台設定', icon: Settings },
  { path: '/dataAnalysis', label: '數據分析', icon: BarChart3 },
  { path: '/authorityManagement', label: '權限管理', icon: ShieldCheck },
  { path: '/members', label: '會員管理', icon: Users },
  { path: '/tables', label: '桌況管理', icon: LayoutGrid },
]

// 切換頁面
// P7（D-12）：原本這裡每個分支都要手動同步一份 pageStore.currentPage，
// 現在「記住上次瀏覽頁籤」改由 router.afterEach 自動處理（見
// router/index.ts、stores/page.ts），這裡只需要單純導航。
// P8：組件庫替換——ElMessageBox.confirm／ElMessage 改用 composables/
// useConfirm.ts／useToast.ts（見 views/order/index.vue 的說明，同一套
// 基礎設施）。
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
</script>
