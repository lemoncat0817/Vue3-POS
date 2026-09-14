<template>
  <ModalDialog :open="open" title="付款" @update:open="(value) => !value && emit('cancel')">
    <div class="flex flex-col gap-4">
      <!-- 金額總覽：應付、已支付、剩餘應付／找零，付款過程中隨時看得到目前狀態。 -->
      <div
        class="grid grid-cols-3 gap-2 rounded-lg bg-surface-50 dark:bg-surface-800 p-3 text-center"
      >
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">應付金額</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-100">$ {{ dueAmount }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">已加入支付</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-100">
            $ {{ tenderedAmount }}
          </p>
        </div>
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">
            {{ remaining > 0 ? '剩餘應付' : '找零' }}
          </p>
          <p
            class="text-lg font-bold"
            :class="
              remaining > 0
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-success-600 dark:text-success-400'
            "
          >
            $ {{ remaining > 0 ? remaining : changeDue }}
          </p>
        </div>
      </div>

      <!-- 已加入的支付方式清單。 -->
      <div v-if="tenders.length > 0" class="flex flex-col gap-1">
        <div
          v-for="(tender, index) in tenders"
          :key="index"
          class="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm"
        >
          <div>
            <span class="font-bold text-surface-900 dark:text-surface-100">{{
              tender.method
            }}</span>
            <span class="ml-2 text-surface-500 dark:text-surface-400">$ {{ tender.amount }}</span>
            <span
              v-if="tender.receivedAmount"
              class="ml-2 text-xs text-surface-400 dark:text-surface-500"
            >
              （實收 $ {{ tender.receivedAmount }}）
            </span>
          </div>
          <button
            type="button"
            class="text-xs font-bold text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
            @click="removeTender(index)"
          >
            移除
          </button>
        </div>
      </div>

      <!-- 應付 0 元訂單仍需加入一筆 amount: 0 的支付記錄以完成結案 -->
      <div
        v-if="remaining > 0 || tenders.length === 0"
        class="flex flex-col gap-2 rounded-lg border border-surface-200 dark:border-surface-700 p-3"
      >
        <p class="text-xs font-bold text-surface-500 dark:text-surface-400">新增支付方式</p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="method in paymentMethods"
            :key="method.name"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors"
            :class="
              draftMethod?.name === method.name
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                : 'border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
            "
            @click="selectDraftMethod(method)"
          >
            {{ method.name }}
          </button>
        </div>
        <div class="flex items-end gap-2">
          <label class="flex-1 text-xs font-bold text-surface-500 dark:text-surface-400">
            分擔金額
            <input
              :value="draftAmount"
              type="text"
              inputmode="numeric"
              min="0"
              :max="remaining"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              @focus="activeField = 'amount'"
              @input="draftAmount = parseRequiredInt(($event.target as HTMLInputElement).value, { max: remaining })"
            />
          </label>
          <label
            v-if="draftMethod?.useMethod === '紙鈔'"
            class="flex-1 text-xs font-bold text-surface-500 dark:text-surface-400"
          >
            實收金額（選填，用來算找零）
            <input
              :value="draftReceivedAmount ?? ''"
              type="text"
              inputmode="numeric"
              min="0"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              @focus="activeField = 'received'"
              @input="draftReceivedAmount = parseOptionalInt(($event.target as HTMLInputElement).value) ?? undefined"
            />
          </label>
          <button
            type="button"
            :disabled="!canAddDraftTender"
            class="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            @click="addDraftTender"
          >
            加入
          </button>
        </div>

        <!-- 現金快捷金額：減少手動輸入實收金額的出錯機會，只在選現金時顯示。 -->
        <div
          v-if="draftMethod?.useMethod === '紙鈔' && quickCashAmounts.length > 0"
          class="flex flex-wrap gap-1.5"
        >
          <button
            v-for="amount in quickCashAmounts"
            :key="amount"
            type="button"
            class="rounded-lg border px-3 py-1 text-xs font-bold transition-colors"
            :class="
              draftReceivedAmount === amount
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
                : 'border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
            "
            @click="selectQuickCashAmount(amount)"
          >
            {{ amount === draftAmount ? `剛好 $${amount}` : `$${amount}` }}
          </button>
        </div>

        <!-- 客製數字鍵盤：現場結帳多半靠觸控，大按鈕比叫出系統鍵盤更快、也不會被
             系統鍵盤擠壓版面；點哪個欄位就編輯哪個欄位，跟上面的輸入框共用同一個值。 -->
        <div class="pt-1">
          <p class="mb-1 text-xs font-bold text-surface-400 dark:text-surface-500">
            正在輸入：{{ activeField === 'amount' ? '分擔金額' : '實收金額' }}
          </p>
          <NumericKeypad
            :model-value="activeAmount"
            :max="activeField === 'amount' ? remaining : undefined"
            @update:model-value="onKeypadInput"
          />
        </div>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="emit('cancel')"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="isSubmitting || remaining > 0 || tenders.length === 0"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          @click="submit"
        >
          確認送出
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import NumericKeypad from '@/components/ui/NumericKeypad.vue'
import { parseOptionalInt, parseRequiredInt } from '@/utils/numberInput'
import type { PaymentMethod } from '@/types'

export interface TenderDraft {
  method: string
  amount: number
  receivedAmount?: number
}

const props = defineProps<{
  open: boolean
  dueAmount: number
  paymentMethods: PaymentMethod[]
}>()

const emit = defineEmits<{
  cancel: []
  submit: [tenders: TenderDraft[]]
}>()

const tenders = ref<TenderDraft[]>([])
const draftMethod = ref<PaymentMethod>()
const draftAmount = ref(0)
const draftReceivedAmount = ref<number | undefined>(undefined)
const activeField = ref<'amount' | 'received'>('amount')
const activeAmount = computed(() =>
  activeField.value === 'amount' ? draftAmount.value : (draftReceivedAmount.value ?? 0)
)
function onKeypadInput(value: number) {
  if (activeField.value === 'amount') draftAmount.value = value
  else draftReceivedAmount.value = value
}
function selectQuickCashAmount(amount: number) {
  draftReceivedAmount.value = amount
  activeField.value = 'received'
}

const tenderedAmount = computed(() => tenders.value.reduce((sum, tender) => sum + tender.amount, 0))
const remaining = computed(() => Math.max(0, props.dueAmount - tenderedAmount.value))
const changeDue = computed(() =>
  tenders.value.reduce(
    (sum, tender) => sum + ((tender.receivedAmount ?? tender.amount) - tender.amount),
    0
  )
)

// 提供精確金額、百元進位及常見大鈔面額供快捷輸入。
const CASH_NOTES = [100, 500, 1000, 2000]
const quickCashAmounts = computed(() => {
  const due = draftAmount.value
  if (due <= 0) return []
  const amounts = new Set<number>([due])
  const roundedUp = Math.ceil(due / 100) * 100
  if (roundedUp > due) amounts.add(roundedUp)
  for (const note of CASH_NOTES) {
    if (note >= due) amounts.add(note)
  }
  return [...amounts].sort((a, b) => a - b).slice(0, 5)
})

const canAddDraftTender = computed(() => {
  if (!draftMethod.value) return false
  // 顯式排除 NaN 避免後續比較式異常通過。
  if (!Number.isFinite(draftAmount.value)) return false
  if (draftAmount.value <= 0 && remaining.value > 0) return false
  if (draftAmount.value > remaining.value) return false
  if (draftReceivedAmount.value !== undefined) {
    if (!Number.isFinite(draftReceivedAmount.value)) return false
    if (draftReceivedAmount.value < draftAmount.value) return false
  }
  return true
})

function selectDraftMethod(method: PaymentMethod) {
  draftMethod.value = method
  draftAmount.value = remaining.value
  draftReceivedAmount.value = undefined
  activeField.value = 'amount'
}

function addDraftTender() {
  if (!draftMethod.value || !canAddDraftTender.value) return
  tenders.value.push({
    method: draftMethod.value.name,
    amount: draftAmount.value,
    ...(draftReceivedAmount.value ? { receivedAmount: draftReceivedAmount.value } : {})
  })
  draftMethod.value = undefined
  draftAmount.value = 0
  draftReceivedAmount.value = undefined
  activeField.value = 'amount'
}

function removeTender(index: number) {
  tenders.value.splice(index, 1)
}

const isSubmitting = ref(false)

function submit() {
  if (isSubmitting.value || remaining.value > 0 || tenders.value.length === 0) return
  isSubmitting.value = true
  emit('submit', tenders.value)
}

watch(
  () => props.open,
  (isOpen) => {
    isSubmitting.value = false
    if (!isOpen) return
    tenders.value = []
    draftMethod.value = undefined
    draftAmount.value = props.dueAmount
    draftReceivedAmount.value = undefined
    activeField.value = 'amount'
  }
)
</script>
