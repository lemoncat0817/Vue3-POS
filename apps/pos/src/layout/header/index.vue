<template>
  <header
    class="flex h-16 w-screen items-center gap-2 border-b border-surface-200 bg-white/95 px-4 backdrop-blur-md dark:border-surface-800 dark:bg-surface-950/95 shadow-sm transition-colors sticky top-0 z-40"
  >
    <div class="flex items-center gap-2.5 mr-2">
      <div class="hidden 2xl:flex flex-col">
        <span
          class="text-sm font-black tracking-tight text-surface-900 dark:text-surface-50 leading-none"
          >POS</span
        >
        <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider"
          >COMMERCIAL POS</span
        >
      </div>
    </div>

    <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs lg:text-sm font-bold transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :class="
          router.currentRoute.value.path === item.path
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100'
        "
        @click="changePage(item.path)"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0 opacity-90" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="ml-auto flex items-center gap-2.5 shrink-0">
      <div
        class="hidden lg:flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-700 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 shadow-inner"
      >
        <span>旗艦店 · 機台 A</span>
        <span class="h-1 w-1 rounded-full bg-surface-300 dark:bg-surface-600"></span>
        <span>{{ cashierDisplayName }}</span>
      </div>

      <div
        v-if="syncStatus.pendingCount > 0"
        data-testid="sync-status"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold animate-pulse shadow-sm"
        :class="
          syncStatus.lastError
            ? 'bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300'
            : 'bg-info-100 text-info-800 dark:bg-info-950 dark:text-info-300'
        "
      >
        <RefreshCw class="h-3 w-3 animate-spin shrink-0" />
        <span v-if="syncStatus.isSyncing">同步中</span>
        <span v-else-if="syncStatus.lastError">同步失敗，重試中</span>
        <span v-else>等待連線同步</span>
        <span>（{{ syncStatus.pendingCount }} 筆）</span>
      </div>

      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors shadow-sm"
        :aria-label="theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" class="h-4 w-4 text-accent-400" />
        <Moon v-else class="h-4 w-4 text-surface-600" />
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs lg:text-sm font-bold text-surface-700 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 dark:hover:border-danger-800 transition-all shadow-sm"
        @click="logout"
      >
        <LogOut class="h-4 w-4 shrink-0" />
        <span>登出</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Sun, Moon, LogOut, RefreshCw } from 'lucide-vue-next'
import { navItems, useAppShell } from '@/composables/useAppShell'

const { router, theme, toggleTheme, syncStatus, cashierDisplayName, changePage, logout } =
  useAppShell()
</script>
