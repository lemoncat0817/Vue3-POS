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
            桌況管理
          </h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            監控內用桌況即時狀態、入座備註與席位調配
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs lg:text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openAddDialog"
          >
            <Plus class="h-4 w-4" />
            <span>新增桌位</span>
          </button>
        </div>
      </div>

      <div
        class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm p-4 overflow-hidden"
      >
        <div
          class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800"
        >
          <div
            class="flex items-center gap-4 text-xs font-bold text-surface-600 dark:text-surface-400"
          >
            <span class="flex items-center gap-1.5"
              ><span
                class="h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-success-500/20"
              ></span
              >空桌</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-danger-500/20"></span
              >使用中</span
            >
            <span class="flex items-center gap-1.5"
              ><span
                class="h-2.5 w-2.5 rounded-full bg-warning-500 ring-2 ring-warning-500/20"
              ></span
              >已預約</span
            >
          </div>
          <span class="text-xs font-bold text-surface-500">共 {{ tables.length }} 個桌位</span>
        </div>

        <div
          v-if="tables.length === 0"
          class="mt-8 py-8 text-center text-surface-400 dark:text-surface-500"
        >
          還沒有設定任何桌位
        </div>
        <div
          v-else
          class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <button
            v-for="table in tables"
            :key="table.id"
            type="button"
            data-testid="table-card"
            class="flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors"
            :class="statusCardClass(table.status)"
            @click="openStatusDialog(table)"
          >
            <div class="flex w-full items-center justify-between">
              <span class="text-lg font-black">{{ table.tableNumber }}</span>
              <span
                class="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold dark:bg-black/20"
                >{{ statusLabel(table.status) }}</span
              >
            </div>
            <span class="text-xs opacity-80">{{ table.seats }} 人座</span>
            <span v-if="table.note" class="mt-1 line-clamp-2 text-xs opacity-80">{{
              table.note
            }}</span>
          </button>
        </div>
      </div>

      <ModalDialog v-model:open="addDialog" title="新增桌位">
        <Form
          v-slot="{ isSubmitting }"
          :validation-schema="toTypedSchema(addTableSchema)"
          :initial-values="{ tableNumber: '', seats: 4 }"
          @submit="onSubmitAdd"
        >
          <FormField
            name="tableNumber"
            label="桌號"
            :disabled="isSubmitting"
            placeholder="例如: A1"
          />
          <FormField
            name="seats"
            label="座位數"
            type="number"
            step="1"
            :disabled="isSubmitting"
            placeholder="例如: 4"
          />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              @click="addDialog = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              新增
            </button>
          </div>
        </Form>
      </ModalDialog>

      <ModalDialog v-model:open="statusDialog" :title="`${currentTable?.tableNumber ?? ''} 桌況`">
        <div class="flex flex-col gap-3 pt-1">
          <div class="flex gap-2 pt-0.5">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="flex-1 rounded-lg border-2 px-2 py-2 text-sm font-bold transition-colors"
              :class="statusButtonClass(option.value)"
              :disabled="!canManage"
              @click="pendingStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <label class="flex flex-col gap-1 text-sm text-surface-600 dark:text-surface-400">
            備註
            <textarea
              v-model="pendingNote"
              rows="2"
              :disabled="!canManage"
              class="rounded-lg border border-surface-300 bg-white p-2 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              placeholder="例如: 4 位客人，14:00 帶位"
            ></textarea>
          </label>
          <div class="flex justify-between gap-2">
            <button
              type="button"
              class="rounded-lg border border-danger-200 px-4 py-2 text-sm font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
              :class="{ 'pointer-events-none opacity-40': !canManage }"
              @click="deleteCurrentTable"
            >
              刪除桌位
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                @click="statusDialog = false"
              >
                取消
              </button>
              <button
                type="button"
                :disabled="!canManage"
                class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                @click="saveStatus"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </ModalDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { useLoginStore } from '@/stores/login'
import { hasCapability } from '@/utils/selection'
import { apiErrorMessage } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { createTable, deleteTable, fetchTables, updateTableStatus } from '@/api/tables'
import { tableStatusCardClass, tableStatusLabel, tableStatusOptions } from '@/utils/tableStatus'
import type { DiningTable, TableStatus } from '@pos/contract'

const loginStore = useLoginStore()
const canManage = computed(() => hasCapability(loginStore.userInfo, 'canManageTables'))

// 桌況為後台管理專用資料，無需離線可用，掛載時直接向伺服端獲取最新清單。
const tables = ref<DiningTable[]>([])
onMounted(async () => {
  try {
    tables.value = await fetchTables()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
})

const statusOptions = tableStatusOptions
const statusLabel = tableStatusLabel
const statusCardClass = tableStatusCardClass
function statusButtonClass(status: TableStatus): string {
  const active = status === pendingStatus.value
  const base = statusCardClass(status)
  return active
    ? `${base} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-surface-900 ring-primary-500`
    : `${base} opacity-50`
}

const addTableSchema = z.object({
  tableNumber: z.string().trim().min(1, '請輸入桌號'),
  seats: z.coerce.number().int().positive('座位數需為正整數')
})

const addDialog = ref(false)
function openAddDialog() {
  if (!canManage.value) return
  addDialog.value = true
}
async function onSubmitAdd(values: Record<string, unknown>) {
  const input = values as { tableNumber: string; seats: number }
  try {
    const created = await createTable(input)
    tables.value = [...tables.value, created]
    addDialog.value = false
    showToast('新增成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

const statusDialog = ref(false)
const currentTable = ref<DiningTable | null>(null)
const pendingStatus = ref<TableStatus>('empty')
const pendingNote = ref('')
function openStatusDialog(table: DiningTable) {
  currentTable.value = table
  pendingStatus.value = table.status
  pendingNote.value = table.note
  statusDialog.value = true
}
async function saveStatus() {
  if (!canManage.value || !currentTable.value) return
  try {
    const updated = await updateTableStatus(currentTable.value.id, {
      status: pendingStatus.value,
      note: pendingNote.value
    })
    const target = tables.value.find((item) => item.id === updated.id)
    if (target) {
      target.status = updated.status
      target.note = updated.note
    }
    statusDialog.value = false
    showToast('保存成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function deleteCurrentTable() {
  if (!canManage.value || !currentTable.value) return
  const table = currentTable.value
  const result = await confirm({
    title: '警告',
    description: `是否刪除桌位 ${table.tableNumber}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deleteTable(table.id)
    tables.value = tables.value.filter((item) => item.id !== table.id)
    statusDialog.value = false
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
