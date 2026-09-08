<template>
  <aside
    class="flex h-screen shrink-0 flex-col border-r border-surface-200 bg-white transition-[width] duration-200 dark:border-surface-800 dark:bg-surface-900"
    :class="collapsed ? 'w-16' : 'w-56'">
    <!-- 品牌識別 -->
    <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-200 px-4 dark:border-surface-800">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-black text-white">
        P
      </div>
      <div v-if="!collapsed" class="flex flex-col leading-none">
        <span class="text-sm font-black tracking-tight text-surface-900 dark:text-surface-50">POS</span>
        <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider">COMMERCIAL POS</span>
      </div>
    </div>

    <!-- 導覽項目：跟點餐首頁頂部列共用同一份 navItems／changePage（見
         composables/useAppShell.ts），只是這裡畫成縱向側邊欄。 -->
    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      <button
        v-for="item in navItems" :key="item.path" type="button"
        :title="collapsed ? item.label : undefined"
        class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :class="[
          collapsed ? 'justify-center' : '',
          router.currentRoute.value.path === item.path
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100',
        ]"
        @click="changePage(item.path)">
        <component :is="item.icon" class="h-4 w-4 shrink-0 opacity-90" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </button>
    </nav>

    <!-- 收合切換：狀態存 localStorage，重新整理後維持上次的收合狀態。 -->
    <div class="shrink-0 border-t border-surface-200 p-2 dark:border-surface-800">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        :class="collapsed ? 'justify-center' : ''"
        :aria-label="collapsed ? '展開側邊欄' : '收合側邊欄'"
        @click="collapsed = !collapsed">
        <PanelLeftClose v-if="!collapsed" class="h-4 w-4 shrink-0" />
        <PanelLeftOpen v-else class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">收合</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
// UI-3（規劃書 §4.1「後台 Shell」）：訂單／後台設定／數據分析／權限
// 管理／會員管理／桌況管理這六個後台頁面共用的左側導覽——取代原本
// 跟點餐首頁擠在同一條 64px 高頂部列的水平導覽（規劃書 §3.1：『三層
// 導覽都擠在頂部列，1366px 寬度下會開始擠壓』）。點餐首頁（觸控主
// 戰場，需要全寬）維持原本的頂部列，不套用這個側邊欄，見
// layout/header/index.vue、router/routes.ts 的說明。
import { ref, watch } from 'vue'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { navItems, useAppShell } from '@/composables/useAppShell'

const { router, changePage } = useAppShell()

const STORAGE_KEY = 'pos-admin-sidebar-collapsed'
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true')
watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // 私密瀏覽模式或使用者關閉了網站資料存取權限時，localStorage 可能
    // 整個不可用——收合狀態只是體驗細節，存不了就記憶體內維持這一次
    // session，不影響側邊欄本身正常運作。
  }
})
</script>
