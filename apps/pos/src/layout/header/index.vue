<template>
  <header
    class="flex h-16 w-screen items-center gap-1 border-b border-surface-200 bg-white px-4 dark:border-surface-800 dark:bg-surface-950">
    <!-- P11（規劃書 §12「視覺系統與體驗」）：原本整條導覽列都是滿版
         bg-red-500，每個分頁籤各自再套一層 bg-red-600，「已選取」用
         bg-yellow-500 + scale-[1.2]。改成中性色的頂欄（跟結帳畫面主體
         同一套 surface 色階），品牌紅只留給「目前選取的分頁」——規劃書
         §12「結帳畫面上真正需要搶眼的只有金額與主要動作鍵」的原則同樣
         適用在導覽列：不是每個東西都要用品牌色搶注意力。分頁籤也從
         <div @click> 改成語意正確的 <button>，讓 Tab／Enter 這類鍵盤
         操作原生就能用（規劃書 §13「全鍵盤可達」）。 -->
    <img src="@/assets/logo.png" alt="MAJI Tea logo" class="mr-3 h-11 w-11 rounded-lg">

    <nav class="flex items-center gap-1">
      <button
        v-for="item in navItems" :key="item.path" type="button"
        class="rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :class="router.currentRoute.value.path === item.path
          ? 'bg-primary-600 text-white'
          : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'"
        @click="changePage(item.path)">
        {{ item.label }}
      </button>
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <!-- P3：離線送單佇列的同步狀態（見 src/offline/sync-worker.ts）。
           平常佇列是空的，不佔畫面；有東西還沒送達伺服端時才顯示。 -->
      <div
        v-if="syncStatus.pendingCount > 0" data-testid="sync-status"
        class="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
        :class="syncStatus.lastError ? 'bg-warning-100 text-warning-800' : 'bg-info-100 text-info-800'">
        <span v-if="syncStatus.isSyncing">同步中</span>
        <span v-else-if="syncStatus.lastError">同步失敗，將自動重試</span>
        <span v-else>等待連線同步</span>
        <span>（{{ syncStatus.pendingCount }} 筆）</span>
      </div>

      <button
        type="button" class="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
        :aria-label="theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'" @click="toggleTheme">
        <span aria-hidden="true">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
      </button>

      <button
        type="button"
        class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
        @click="logout">登出</button>
    </div>
  </header>
</template>

<script setup lang="ts">
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

const { theme, toggleTheme } = useTheme()

const navItems = [
  { path: '/home', label: '點餐' },
  { path: '/order', label: '查看訂單' },
  { path: '/backgroundSetting', label: '後台設定' },
  { path: '/dataAnalysis', label: '數據分析' },
  { path: '/authorityManagement', label: '權限管理' },
  { path: '/members', label: '會員管理' },
  { path: '/tables', label: '桌況管理' },
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
