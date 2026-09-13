<template>
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
    Teleport 到 body、position: fixed 算絕對座標：這顆輸入框常被塞在窄版
    面板（例如點餐頁購物車卡片）裡，該面板普遍設了 overflow-hidden 避免
    內容溢出，清單若照一般 absolute 定位會被那層裁掉、或被裁到跑版；
    直接掛到 body 底下就不受任何祖先 overflow/寬度限制。
    父層 mousedown.prevent：阻止點擊選項時 input 先觸發 blur 把清單收起來，
    這是 combobox 常見手法，讓「點擊清單項目」跟「輸入框失焦」不互搶。
  -->
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed z-50 w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-overlay overflow-hidden"
      :style="dropdownStyle"
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
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchTables } from '@/api/tables'
import { confirm } from '@/composables/useConfirm'
import { tableStatusLabel } from '@/utils/tableStatus'
import type { DiningTable, TableStatus } from '@pos/contract'

const text = defineModel<string>({ default: '' })
const open = ref(false)
const inputEl = ref<HTMLInputElement>()
const dropdownStyle = ref({ top: '0px', left: '0px' })

const { data, isLoading, refetch } = useQuery({
  queryKey: ['tables'],
  queryFn: fetchTables,
  enabled: false
})
const tables = computed<DiningTable[]>(() => data.value ?? [])

const DROPDOWN_WIDTH = 176

function handleFocus() {
  const rect = inputEl.value?.getBoundingClientRect()
  if (rect) {
    const left = Math.min(rect.left, window.innerWidth - DROPDOWN_WIDTH - 8)
    dropdownStyle.value = { top: `${rect.bottom + 4}px`, left: `${Math.max(left, 4)}px` }
  }
  open.value = true
  refetch()
}

// fixed 定位清單於捲動時收合以避免座標偏離。
watch(open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('scroll', closeOnScroll, true)
  } else {
    window.removeEventListener('scroll', closeOnScroll, true)
  }
})
function closeOnScroll() {
  open.value = false
}
onUnmounted(() => {
  window.removeEventListener('scroll', closeOnScroll, true)
})

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

watch(text, (value) => {
  if (value === '') open.value = false
})
</script>
