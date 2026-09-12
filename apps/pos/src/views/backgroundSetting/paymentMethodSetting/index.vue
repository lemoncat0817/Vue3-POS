<template>
  <div class="w-full flex flex-col">
    <div
      class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm flex flex-col justify-between min-h-[540px]"
    >
      <div
        class="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-5 py-3.5"
      >
        <span class="text-sm font-black text-surface-900 dark:text-surface-100">付款方式</span>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-3 py-1.5 text-xs"
          :class="{ 'opacity-50 pointer-events-none': !canSetPayMethod }"
          @click="openAddDialog"
        >
          ＋ 新增付款方式
        </button>
      </div>

      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400"
          >
            <tr>
              <th class="px-4 py-3.5 text-left">付款方式</th>
              <th class="px-4 py-3.5 text-center">支付方式</th>
              <th class="px-4 py-3.5 text-center">啟用狀態</th>
              <th class="px-4 py-3.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr v-if="sliceList.length === 0">
              <td colspan="4" class="px-4 py-16 text-center text-surface-400 dark:text-surface-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <CreditCard class="h-10 w-10 text-surface-300 dark:text-surface-700" />
                  <span class="text-base font-semibold text-surface-700 dark:text-surface-300"
                    >沒有付款方式</span
                  >
                  <span class="text-xs text-surface-400 dark:text-surface-500"
                    >尚未建立付款方式，可點選上方「＋ 新增付款方式」</span
                  >
                </div>
              </td>
            </tr>
            <tr
              v-for="row in sliceList"
              :key="row.id"
              class="transition-colors hover:bg-surface-50/80 dark:hover:bg-surface-800/40"
            >
              <td
                class="px-4 py-3.5 align-middle text-left font-bold text-surface-900 dark:text-surface-100"
              >
                {{ row.name }}
              </td>
              <td class="px-4 py-3.5 align-middle text-center">
                <span
                  class="inline-flex items-center rounded-md bg-surface-100 dark:bg-surface-800 px-2.5 py-0.5 text-[11px] font-mono font-medium text-surface-600 dark:text-surface-300"
                  >{{ row.useMethod }}</span
                >
              </td>
              <td class="px-4 py-3.5 align-middle text-center">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  :class="
                    row.disabled === false
                      ? 'bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400'
                      : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500'
                  "
                >
                  {{ row.disabled === false ? '啟用中' : '已停用' }}
                </span>
              </td>
              <td class="px-4 py-3.5 align-middle text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="pos-btn pos-btn-secondary px-2.5 py-1 text-xs"
                    :class="{ 'opacity-50 pointer-events-none': !canSetPayMethod }"
                    @click="openEditDialog(row)"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    class="pos-btn pos-btn-danger px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!canRemovePayMethod(row)"
                    :title="canRemovePayMethod(row) ? undefined : removePayMethodDisabledReason(row)"
                    @click="removePayMethod(row)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination
        :page="page"
        :page-count="pageCount"
        :total="orderStore.paymentList.length"
        :current-count="sliceList.length"
        unit="筆付款方式"
        @update:page="(v) => (page = v)"
      />
    </div>

    <ModalDialog
      v-model:open="dialog.open"
      :title="dialog.editingId ? '編輯付款方式' : '新增付款方式'"
    >
      <div class="space-y-4 py-1">
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
            >付款方式的名稱</label
          >
          <input
            v-model="dialog.name"
            class="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="例如: 現金、LinePay..."
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
            >支付方式</label
          >
          <SelectRoot v-model="dialog.useMethod">
            <SelectTrigger
              class="flex w-full items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-xs font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <SelectValue placeholder="選擇支付方式" />
              <span aria-hidden="true" class="text-surface-400">▾</span>
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                class="z-50 min-w-[200px] rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-1 shadow-lg"
                position="popper"
              >
                <SelectViewport class="p-1">
                  <SelectItem
                    v-for="item in payMethodOptions"
                    :key="item.value"
                    :value="item.value"
                    class="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 outline-none hover:bg-surface-100 dark:hover:bg-surface-800 data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary-600 dark:data-[state=checked]:bg-primary-950/40 dark:data-[state=checked]:text-primary-400"
                  >
                    <SelectItemText>{{ item.label }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>
        <div
          class="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/40 p-3"
        >
          <div>
            <label class="block text-xs font-bold text-surface-900 dark:text-surface-100"
              >是否啟用</label
            >
            <span class="text-[11px] text-surface-400">啟用後將於結帳收銀面板中顯示</span>
          </div>
          <SwitchRoot
            v-model="dialog.enabled"
            class="relative h-6 w-11 rounded-full bg-surface-300 dark:bg-surface-700 data-[state=checked]:bg-primary-500"
          >
            <SwitchThumb
              class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]"
            />
          </SwitchRoot>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          class="pos-btn pos-btn-secondary px-4 py-2 text-xs font-bold"
          @click="dialog.open = false"
        >
          取消
        </button>
        <button
          type="button"
          class="pos-btn pos-btn-primary px-5 py-2 text-xs font-bold"
          @click="submit"
        >
          {{ dialog.editingId ? '保存' : '新增' }}
        </button>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CreditCard } from 'lucide-vue-next'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SwitchRoot,
  SwitchThumb
} from 'reka-ui'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import type { PaymentMethod, PaymentUseMethod } from '@/types'
import { hasCapability } from '@/utils/selection'
import { apiErrorMessage } from '@/api/http'
import {
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod
} from '@/api/payment-methods'

const canSetPayMethod = computed(() => hasCapability(loginStore.userInfo, 'canSetPayMethod'))
// 現金是系統保留的付款方式，這個限制跟權限無關，逐列判斷。
const canRemovePayMethod = (row: PaymentMethod) => canSetPayMethod.value && row.name !== '現金'
const removePayMethodDisabledReason = (row: PaymentMethod) => {
  if (!canSetPayMethod.value) return '沒有設定付款方式的權限'
  if (row.name === '現金') return '現金為系統保留的付款方式，不可刪除'
  return ''
}

const payMethodOptions = [
  { value: '紙鈔', label: '紙鈔' },
  { value: '感應', label: '感應' },
  { value: '掃描', label: '掃描' }
]

const page = ref(1)
const pageCount = computed(() => Math.max(Math.ceil(orderStore.paymentList.length / 10), 1))
const sliceList = computed(() =>
  orderStore.paymentList.slice((page.value - 1) * 10, page.value * 10)
)

const dialog = reactive<{
  open: boolean
  editingId: PaymentMethod['id'] | null
  name: string
  useMethod: PaymentUseMethod | ''
  enabled: boolean
}>({
  open: false,
  editingId: null,
  name: '',
  useMethod: '',
  enabled: true
})
function openAddDialog() {
  dialog.editingId = null
  dialog.name = ''
  dialog.useMethod = ''
  dialog.enabled = true
  dialog.open = true
}
function openEditDialog(row: PaymentMethod) {
  if (row.name === '現金') {
    showToast('不可編輯現金支付', 'error')
    return
  }
  dialog.editingId = row.id
  dialog.name = row.name
  dialog.useMethod = row.useMethod
  dialog.enabled = !row.disabled
  dialog.open = true
}
async function submit() {
  if (dialog.name.trim() === '' || dialog.useMethod === '') {
    showToast('請輸入完整資訊', 'error')
    return
  }
  if (
    orderStore.paymentList.some((item) => item.name === dialog.name && item.id !== dialog.editingId)
  ) {
    showToast('此付款方式已存在,請重新輸入', 'error')
    return
  }
  const payload = {
    name: dialog.name,
    disabled: !dialog.enabled,
    useMethod: dialog.useMethod as PaymentUseMethod
  }
  try {
    if (dialog.editingId === null) {
      const created = await createPaymentMethod(payload)
      orderStore.paymentList = [...orderStore.paymentList, created]
      showToast('新增付款方式成功', 'success')
    } else {
      const updated = await updatePaymentMethod(String(dialog.editingId), payload)
      const index = orderStore.paymentList.findIndex((item) => item.id === dialog.editingId)
      if (index !== -1) orderStore.paymentList[index] = updated
      showToast('保存成功', 'success')
    }
    dialog.open = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
async function removePayMethod(row: PaymentMethod) {
  if (row.name === '現金') {
    showToast('不可刪除現金支付', 'error')
    return
  }
  const result = await confirm({
    title: '警告',
    description: `是否刪除付款方式 ${row.name}？`,
    variant: 'danger'
  })
  if (result !== 'confirm') return
  try {
    await deletePaymentMethod(String(row.id))
    orderStore.paymentList = orderStore.paymentList.filter((item) => item.id !== row.id)
    showToast('刪除成功', 'success')
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}
</script>

<style lang="scss" scoped></style>
