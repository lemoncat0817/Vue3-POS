<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 dark:border-surface-800 px-6 py-4 bg-surface-50/50 dark:bg-surface-900"
  >
    <div class="text-sm text-surface-500 dark:text-surface-400">
      總共有
      <span class="font-bold text-primary-600 dark:text-primary-400">{{ total }}</span>
      {{ unit }}， 當前頁面有
      <span class="font-bold text-primary-600 dark:text-primary-400">{{ currentCount }}</span>
      {{ unit }}
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="pos-btn pos-btn-secondary px-3.5 py-1.5 text-sm"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        上一頁
      </button>
      <span class="px-3 text-sm font-bold text-surface-700 dark:text-surface-300 font-mono">
        {{ total > 0 ? page : 0 }} / {{ Math.max(pageCount, 1) }}
      </span>
      <button
        type="button"
        class="pos-btn pos-btn-secondary px-3.5 py-1.5 text-sm"
        :disabled="page >= pageCount || total === 0"
        @click="emit('update:page', page + 1)"
      >
        下一頁
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    page: number
    pageCount: number
    total: number
    currentCount: number
    unit?: string
  }>(),
  {
    unit: '筆'
  }
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()
</script>
