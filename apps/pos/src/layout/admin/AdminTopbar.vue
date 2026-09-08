<template>
  <header
    class="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-200 bg-white/95 px-4 backdrop-blur-md dark:border-surface-800 dark:bg-surface-950/95 shadow-sm">
    <!-- 這裡刻意不重複放頁面標題——各頁自己的 <h1> 才是真正的頁面標題
         （見 views/*/index.vue 的 PageHeader 卡片），部分頁面的 <h1>
         文字剛好跟側邊欄的導覽項目文字完全相同（例如「會員管理」），
         topbar 再放一次同樣的文字，會讓 getByText 這類定位在畫面上
         同時比對到三個地方，非必要不引入這個風險。 -->
    <div class="ml-auto flex items-center gap-2.5 shrink-0">
      <!-- 門市與值班收銀員徽章 -->
      <div class="hidden lg:flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-700 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 shadow-inner">
        <Store class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
        <span>旗艦店 · 機台 A</span>
        <span class="h-1 w-1 rounded-full bg-surface-300 dark:bg-surface-600"></span>
        <UserCheck class="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
        <span>{{ cashierDisplayName }}</span>
      </div>

      <!-- P3：離線送單佇列的同步狀態，跟 layout/header/index.vue 是同一份
           syncStatus（見 useAppShell.ts），行為完全一致。 -->
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
// UI-3（規劃書 §4.1「後台 Shell」）：後台 shell 頂部列，只留右側狀態
// 與操作（門市徽章／同步狀態／主題切換／登出）——導覽移到左側
// AdminSidebar.vue，跟點餐首頁的頂部列（layout/header/index.vue）共用
// 同一份 useAppShell 邏輯。
import { Sun, Moon, LogOut, RefreshCw, Store, UserCheck } from 'lucide-vue-next'
import { useAppShell } from '@/composables/useAppShell'

const { theme, toggleTheme, syncStatus, cashierDisplayName, logout } = useAppShell()
</script>
