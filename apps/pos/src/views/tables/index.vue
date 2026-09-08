<template>
  <div class="w-full flex flex-col items-center overflow-y-auto bg-surface-50/50 dark:bg-surface-950 px-4 py-6 min-h-[calc(100vh-64px)]">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <!-- 頂部標題卡片 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">桌況管理</h1>
            <span class="rounded-full bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              內用席位
            </span>
          </div>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            監控內用桌況即時狀態、入座備註與席位調配
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs lg:text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 select-none"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="openAddDialog">
            <Plus class="h-4 w-4" />
            <span>新增桌位</span>
          </button>
        </div>
      </div>

      <!-- 桌況狀態卡片 -->
      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm p-4 overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
          <div class="flex items-center gap-4 text-xs font-bold text-surface-600 dark:text-surface-400">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-success-500/20"></span>空桌</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-danger-500/20"></span>使用中</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>已預約</span>
          </div>
          <span class="text-xs font-bold text-surface-500">共 {{ tables.length }} 個桌位</span>
        </div>

      <div v-if="tables.length === 0" class="mt-8 py-8 text-center text-surface-400 dark:text-surface-500">還沒有設定任何桌位</div>
      <div v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <button
          v-for="table in tables" :key="table.id" type="button"
          data-testid="table-card"
          class="flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors"
          :class="statusCardClass(table.status)"
          @click="openStatusDialog(table)">
          <div class="flex w-full items-center justify-between">
            <span class="text-lg font-black">{{ table.tableNumber }}</span>
            <span class="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold dark:bg-black/20">{{ statusLabel(table.status) }}</span>
          </div>
          <span class="text-xs opacity-80">{{ table.seats }} 人座</span>
          <span v-if="table.note" class="mt-1 line-clamp-2 text-xs opacity-80">{{ table.note }}</span>
        </button>
      </div>
    </div>

    <!-- 新增桌位 -->
    <ModalDialog v-model:open="addDialog" title="新增桌位">
      <Form v-slot="{ isSubmitting }" :validation-schema="toTypedSchema(addTableSchema)" :initial-values="{ tableNumber: '', seats: 4 }" @submit="onSubmitAdd">
        <FormField name="tableNumber" label="桌號" :disabled="isSubmitting" placeholder="例如: A1" />
        <FormField name="seats" label="座位數" type="number" step="1" :disabled="isSubmitting" placeholder="例如: 4" />
        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="addDialog = false">取消</button>
          <button type="submit" :disabled="isSubmitting" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">新增</button>
        </div>
      </Form>
    </ModalDialog>

    <!-- 帶位／清空／預約：切換桌況＋備註 -->
    <ModalDialog v-model:open="statusDialog" :title="`${currentTable?.tableNumber ?? ''} 桌況`">
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <button
            v-for="option in statusOptions" :key="option.value" type="button"
            class="flex-1 rounded-lg border-2 px-2 py-2 text-sm font-bold transition-colors"
            :class="statusButtonClass(option.value)"
            :disabled="!canManage"
            @click="pendingStatus = option.value">{{ option.label }}</button>
        </div>
        <label class="flex flex-col gap-1 text-sm text-surface-600 dark:text-surface-400">
          備註
          <textarea
            v-model="pendingNote" rows="2" :disabled="!canManage"
            class="rounded-lg border border-surface-300 bg-white p-2 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
            placeholder="例如: 4 位客人，14:00 帶位"></textarea>
        </label>
        <div class="flex justify-between gap-2">
          <button
            type="button"
            class="rounded-lg border border-danger-200 px-4 py-2 text-sm font-bold text-danger-600 transition-colors hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
            :class="{ 'pointer-events-none opacity-40': !canManage }"
            @click="deleteCurrentTable">刪除桌位</button>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" @click="statusDialog = false">取消</button>
            <button
              type="button" :disabled="!canManage"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
              @click="saveStatus">保存</button>
          </div>
        </div>
      </div>
    </ModalDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
// P24（規劃書 §10 P24「真實硬體整合與桌況管理」）：新增桌位欄位單純
// （桌號＋座位數），用 VeeValidate + Zod 的 <Form> 元件，跟 members/
// index.vue 是同一套模式。桌況切換（空桌／使用中／已預約＋備註）沒有
// 用 <Form>，因為它本質上是一組互斥按鈕，不是傳統表單欄位——跟
// productManagement/index.vue 手動 if/else 的理由相同：不是每個對話框
// 都適合硬套 VeeValidate。
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Form } from 'vee-validate'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { useLoginStore } from '@/stores/login'
import { hasCapability } from '@/utils/selection'
import { ApiError } from '@/api/http'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { createTable, deleteTable, fetchTables, updateTableStatus } from '@/api/tables'
import type { DiningTable, TableStatus } from '@pos/contract'

const loginStore = useLoginStore()
const canManage = () => hasCapability(loginStore.userInfo, 'canManageTables')

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  return '連不上伺服端，請確認網路連線'
}

// 桌況是後台管理專用資料，掛載時直接向伺服端拿最新清單——跟
// members/index.vue 同樣的理由：沒有第二個地方（例如點餐頁）需要
// 離線可用這份清單，不需要套 stores/drink.ts 那種 catalogSource 模式。
const tables = ref<DiningTable[]>([])
onMounted(async () => {
  try {
    tables.value = await fetchTables()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
})

const statusOptions: { value: TableStatus; label: string }[] = [
  { value: 'empty', label: '空桌' },
  { value: 'occupied', label: '使用中' },
  { value: 'reserved', label: '已預約' },
]
function statusLabel(status: TableStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}
function statusCardClass(status: TableStatus): string {
  if (status === 'occupied') return 'border-danger-300 bg-danger-50 text-danger-700 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-300'
  if (status === 'reserved') return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
  return 'border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-300'
}
function statusButtonClass(status: TableStatus): string {
  const active = status === pendingStatus.value
  const base = statusCardClass(status)
  return active ? `${base} ring-2 ring-offset-1 ring-primary-500` : `${base} opacity-50`
}

const addTableSchema = z.object({
  tableNumber: z.string().trim().min(1, '請輸入桌號'),
  seats: z.coerce.number().int().positive('座位數需為正整數'),
})

const addDialog = ref(false)
function openAddDialog() {
  if (!canManage()) return
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
  if (!canManage() || !currentTable.value) return
  try {
    const updated = await updateTableStatus(currentTable.value.id, { status: pendingStatus.value, note: pendingNote.value })
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
  if (!canManage() || !currentTable.value) return
  const result = await confirm({ title: '警告', description: `是否刪除桌位 ${currentTable.value.tableNumber}？`, variant: 'danger' })
  if (result !== 'confirm') return
  try {
    await deleteTable(currentTable.value.id)
    tables.value = tables.value.filter((item) => item.id !== currentTable.value?.id)
    statusDialog.value = false
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style scoped></style>
