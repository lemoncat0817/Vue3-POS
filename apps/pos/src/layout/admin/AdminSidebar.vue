<template>
  <aside
    class="flex h-screen shrink-0 flex-col border-r border-surface-200 bg-white transition-[width] duration-200 dark:border-surface-800 dark:bg-surface-900"
    :class="collapsed ? 'w-16' : 'w-56'"
  >
    <div
      class="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-200 px-4 dark:border-surface-800"
    >
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-black text-white"
      >
        P
      </div>
      <div v-if="!collapsed" class="flex flex-col leading-none">
        <span class="text-sm font-black tracking-tight text-surface-900 dark:text-surface-50"
          >POS</span
        >
        <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider"
          >COMMERCIAL POS</span
        >
      </div>
    </div>

    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        :title="collapsed ? item.label : undefined"
        class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :class="[
          collapsed ? 'justify-center' : '',
          router.currentRoute.value.path === item.path
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-100'
        ]"
        @click="changePage(item.path)"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0 opacity-90" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </button>
    </nav>

    <div class="shrink-0 border-t border-surface-200 p-2 dark:border-surface-800">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        :class="collapsed ? 'justify-center' : ''"
        :aria-label="collapsed ? '展開側邊欄' : '收合側邊欄'"
        @click="collapsed = !collapsed"
      >
        <PanelLeftClose v-if="!collapsed" class="h-4 w-4 shrink-0" />
        <PanelLeftOpen v-else class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">收合</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
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
    // localStorage 不可用時（如無痕模式）維持 session 內狀態
  }
})
</script>
