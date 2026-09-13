<template>
  <div class="relative">
    <input
      ref="inputEl"
      v-model="text"
      type="text"
      placeholder="桌號"
      data-testid="table-number-input"
      class="w-20 rounded-md border border-surface-300 bg-white px-1.5 py-0.5 text-xs font-bold text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 ml-1"
      @focus="handleFocus"
      @blur="open = false"
    />

    <!--
      父層 mousedown.prevent：阻止點擊選項時 input 先觸發 blur 把清單收起來，
      這是 combobox 常見手法，讓「點擊清單項目」跟「輸入框失焦」不互搶。
    -->
    <div
      v-if="open"
      class="absolute left-1 top-full z-50 mt-1 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-overlay overflow-hidden"
      @mousedown.prevent
    >
      <div v-if="isLoading" class="px-3 py-2 text-xs text-surface-400">載入桌況中…</div>
      <div v-else-if="tables.length === 0" class="px-3 py-2 text-xs text-surface-400">
        尚未設定桌位，可直接手動輸入
      </div>
      <div v-else class="max-h-48 overflow-y-auto py-1">
        <button
          v-for="table in tables"
          :key="table.id"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer"
          @click="selectTable(table)"
        >
          <span class="h-2 w-2 shrink-0 rounded-full" :class="tableStatusDotClass(table.status)" />
          <span class="font-bold text-surface-800 dark:text-surface-100">{{
            table.tableNumber
          }}</span>
          <span class="ml-auto text-surface-400">{{ tableStatusLabel(table.status) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchTables } from '@/api/tables'
import { confirm } from '@/composables/useConfirm'
import { tableStatusLabel } from '@/utils/tableStatus'
import type { DiningTable, TableStatus } from '@pos/contract'

const text = defineModel<string>({ default: '' })
const open = ref(false)
const inputEl = ref<HTMLInputElement>()

// enabled: false——桌況只在真的聚焦輸入框時才抓，不跟著點餐頁一起載入。
const { data, isLoading, refetch } = useQuery({
  queryKey: ['tables'],
  queryFn: fetchTables,
  enabled: false
})
const tables = computed<DiningTable[]>(() => data.value ?? [])

function handleFocus() {
  open.value = true
  refetch()
}

function tableStatusDotClass(status: TableStatus): string {
  if (status === 'occupied') return 'bg-danger-500'
  if (status === 'reserved') return 'bg-warning-500'
  return 'bg-success-500'
}

async function selectTable(table: DiningTable) {
  if (table.status !== 'empty') {
    const result = await confirm({
      title: '桌位狀態提醒',
      description: `${table.tableNumber} 目前狀態為「${tableStatusLabel(table.status)}」，確定要用這桌下單嗎？`,
      confirmText: '確定使用'
    })
    if (result !== 'confirm') return
  }
  text.value = table.tableNumber
  open.value = false
  inputEl.value?.blur()
}

// 外部（送單成功後）把值重置為空字串時，若清單還開著要一併收起。
watch(text, (value) => {
  if (value === '') open.value = false
})
</script>
