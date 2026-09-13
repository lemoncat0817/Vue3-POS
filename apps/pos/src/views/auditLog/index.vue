<template>
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm"
      >
        <div>
          <h1
            class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight"
          >
            操作紀錄
          </h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            查核人員、權限、菜單、促銷、營業設定、會員、桌況、訂單、班別的關鍵異動
          </p>
        </div>
      </div>

      <div
        class="w-full overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col justify-between min-h-[540px]"
      >
        <div
          class="flex flex-col gap-3 border-b border-surface-100 dark:border-surface-800 px-5 py-3.5"
        >
          <form class="flex flex-wrap items-end gap-2" @submit.prevent="onFilterSubmit">
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-surface-500 dark:text-surface-400"
                >關鍵字</label
              >
              <input
                v-model="keywordInput"
                type="text"
                placeholder="搜尋說明內容"
                class="w-44 rounded-lg border border-surface-300 bg-white py-1.5 px-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-surface-500 dark:text-surface-400"
                >操作者</label
              >
              <input
                v-model="operatorInput"
                type="text"
                placeholder="搜尋操作者"
                class="w-36 rounded-lg border border-surface-300 bg-white py-1.5 px-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-surface-500 dark:text-surface-400"
                >動作類型</label
              >
              <select
                v-model="actionInput"
                class="w-40 rounded-lg border border-surface-300 bg-white py-1.5 px-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              >
                <option value="">全部動作</option>
                <optgroup v-for="group in AUDIT_ACTION_GROUPS" :key="group.title" :label="group.title">
                  <option v-for="action in group.actions" :key="action" :value="action">
                    {{ AUDIT_ACTION_LABELS[action] }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-surface-500 dark:text-surface-400"
                >起始日期</label
              >
              <input
                v-model="dateFromInput"
                type="date"
                class="rounded-lg border border-surface-300 bg-white py-1.5 px-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-surface-500 dark:text-surface-400"
                >結束日期</label
              >
              <input
                v-model="dateToInput"
                type="date"
                class="rounded-lg border border-surface-300 bg-white py-1.5 px-3 text-xs text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <button type="submit" class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs">篩選</button>
            <button
              v-if="hasActiveFilter"
              type="button"
              class="pos-btn pos-btn-secondary px-3 py-1.5 text-xs"
              @click="clearFilters"
            >
              清除篩選
            </button>
          </form>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
            >
              <tr>
                <th class="px-4 py-3.5 text-left">時間</th>
                <th class="px-4 py-3.5 text-left">操作者</th>
                <th class="px-4 py-3.5 text-left">動作</th>
                <th class="px-4 py-3.5 text-left">說明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr v-if="logs.length === 0">
                <td colspan="4" class="px-4 py-16 text-center text-surface-400 dark:text-surface-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <History class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                    <span class="text-base font-semibold text-surface-700 dark:text-surface-300">{{
                      hasActiveFilter ? '找不到符合篩選條件的紀錄' : '目前沒有任何操作紀錄'
                    }}</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="log in logs"
                :key="log.id"
                class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
              >
                <td class="px-4 py-3.5 text-left font-mono text-xs text-surface-500 dark:text-surface-400">
                  {{ formatDateTime(log.createdAt) }}
                </td>
                <td class="px-4 py-3.5 text-left font-bold text-surface-900 dark:text-surface-100">
                  {{ log.operator }}
                </td>
                <td class="px-4 py-3.5 text-left">
                  <span
                    class="inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:text-surface-300"
                  >
                    {{ AUDIT_ACTION_LABELS[log.action] }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-left text-surface-600 dark:text-surface-400 max-w-md">
                  <p class="line-clamp-2" :title="log.detail">{{ log.detail }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :page="page"
          :page-count="pageCount"
          :total="totalCount"
          :current-count="logs.length"
          unit="筆"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { History } from 'lucide-vue-next'
import TablePagination from '@/components/ui/TablePagination.vue'
import { listAuditLogs } from '@/api/audit-logs'
import { apiErrorMessage } from '@/api/http'
import { showToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/time'
import { AUDIT_ACTION_GROUPS, AUDIT_ACTION_LABELS } from '@/utils/auditLog'
import type { AuditLog, AuditLogAction } from '@pos/contract'

const pageSize = 20
const logs = ref<AuditLog[]>([])
const page = ref(1)
const pageCount = ref(1)
const totalCount = ref(0)

const keywordInput = ref('')
const operatorInput = ref('')
const actionInput = ref<AuditLogAction | ''>('')
const dateFromInput = ref('')
const dateToInput = ref('')

// 目前實際套用中的篩選條件，跟輸入框分開，避免打字打到一半就觸發查詢——寫法比照 members/index.vue。
const activeKeyword = ref('')
const activeOperator = ref('')
const activeAction = ref<AuditLogAction | ''>('')
const activeDateFrom = ref('')
const activeDateTo = ref('')

const hasActiveFilter = computed(
  () =>
    activeKeyword.value !== '' ||
    activeOperator.value !== '' ||
    activeAction.value !== '' ||
    activeDateFrom.value !== '' ||
    activeDateTo.value !== ''
)

async function loadLogs() {
  try {
    const result = await listAuditLogs({
      keyword: activeKeyword.value || undefined,
      operator: activeOperator.value || undefined,
      action: activeAction.value || undefined,
      dateFrom: activeDateFrom.value || undefined,
      dateTo: activeDateTo.value || undefined,
      page: page.value,
      pageSize
    })
    logs.value = result.items
    pageCount.value = result.pagination.totalPages
    totalCount.value = result.pagination.totalCount
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

function onFilterSubmit() {
  activeKeyword.value = keywordInput.value.trim()
  activeOperator.value = operatorInput.value.trim()
  activeAction.value = actionInput.value
  activeDateFrom.value = dateFromInput.value
  activeDateTo.value = dateToInput.value
  page.value = 1
  loadLogs()
}

function clearFilters() {
  keywordInput.value = ''
  operatorInput.value = ''
  actionInput.value = ''
  dateFromInput.value = ''
  dateToInput.value = ''
  activeKeyword.value = ''
  activeOperator.value = ''
  activeAction.value = ''
  activeDateFrom.value = ''
  activeDateTo.value = ''
  page.value = 1
  loadLogs()
}

function handlePageChange(next: number) {
  page.value = next
  loadLogs()
}

onMounted(loadLogs)
</script>

<style scoped></style>
