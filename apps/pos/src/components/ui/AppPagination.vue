<template>
  <div class="flex items-center gap-1.5">
    <button
      type="button" aria-label="上一頁"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 shadow-sm transition-colors"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)">
      <ChevronLeft class="h-3.5 w-3.5" />
    </button>
    <span class="px-1 font-mono text-[11px] font-bold text-surface-600 dark:text-surface-300">
      {{ total > 0 ? page : 0 }}/{{ pageCount }} 頁
    </span>
    <button
      type="button" aria-label="下一頁"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 shadow-sm transition-colors"
      :disabled="page >= pageCount"
      @click="emit('update:page', page + 1)">
      <ChevronRight class="h-3.5 w-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
// 通用分頁元件；total 為 0 時頁碼顯示第 0 頁
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{ page: number; pageCount: number; total: number }>()
const emit = defineEmits<{ 'update:page': [number] }>()
</script>
