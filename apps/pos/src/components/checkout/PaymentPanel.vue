<template>
  <ModalDialog :open="open" title="付款" @update:open="(value) => !value && emit('cancel')">
    <div class="flex flex-col gap-4">
      <!-- 金額總覽：應付、已支付、剩餘應付／找零，付款過程中隨時看得到目前狀態。 -->
      <div class="grid grid-cols-3 gap-2 rounded-lg bg-surface-50 dark:bg-surface-800 p-3 text-center">
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">應付金額</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-100">$ {{ dueAmount }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">已加入支付</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-100">$ {{ tenderedAmount }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-surface-500 dark:text-surface-400">{{ remaining > 0 ? '剩餘應付' : '找零' }}</p>
          <p class="text-lg font-bold" :class="remaining > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-success-600 dark:text-success-400'">
            $ {{ remaining > 0 ? remaining : changeDue }}
          </p>
        </div>
      </div>

      <!-- 已加入的支付方式清單。 -->
      <div v-if="tenders.length > 0" class="flex flex-col gap-1">
        <div
v-for="(tender, index) in tenders" :key="index"
          class="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm">
          <div>
            <span class="font-bold text-surface-900 dark:text-surface-100">{{ tender.method }}</span>
            <span class="ml-2 text-surface-500 dark:text-surface-400">$ {{ tender.amount }}</span>
            <span v-if="tender.receivedAmount" class="ml-2 text-xs text-surface-400 dark:text-surface-500">
              （實收 $ {{ tender.receivedAmount }}）
            </span>
          </div>
          <button
type="button" class="text-xs font-bold text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
            @click="removeTender(index)">移除</button>
        </div>
      </div>

      <!-- 新增一筆支付：選方式、輸入分擔金額，現金另外可填實收金額算找零。 -->
      <!-- remaining 為 0 但還沒加過任何 tender：應付金額本來就是 0（例如
           折價券折到 0 元）的訂單，仍需要加一筆 amount:0 的 tender 才能
           結案（見 @pos/contract 的 tenderInputSchema 說明），這裡不能
           因為「已經付清」就直接把新增區塊藏起來。 -->
      <div v-if="remaining > 0 || tenders.length === 0" class="flex flex-col gap-2 rounded-lg border border-surface-200 dark:border-surface-700 p-3">
        <p class="text-xs font-bold text-surface-500 dark:text-surface-400">新增支付方式</p>
        <div class="flex flex-wrap gap-1">
          <button
v-for="method in paymentMethods" :key="method.name" type="button"
            class="rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors"
            :class="draftMethod?.name === method.name
              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
              : 'border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'"
            @click="selectDraftMethod(method)">{{ method.name }}</button>
        </div>
        <div class="flex items-end gap-2">
          <label class="flex-1 text-xs font-bold text-surface-500 dark:text-surface-400">
            分擔金額
            <input
v-model.number="draftAmount" type="number" min="0" :max="remaining"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
          </label>
          <label v-if="draftMethod?.useMethod === '紙鈔'" class="flex-1 text-xs font-bold text-surface-500 dark:text-surface-400">
            實收金額（選填，用來算找零）
            <input
v-model.number="draftReceivedAmount" type="number" min="0"
              class="mt-1 w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
          </label>
          <button
type="button" :disabled="!canAddDraftTender"
            class="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            @click="addDraftTender">加入</button>
        </div>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <button
type="button" class="rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800"
          @click="emit('cancel')">取消</button>
        <button
type="button" :disabled="remaining > 0 || tenders.length === 0"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          @click="submit">確認送出</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// P6：規劃書 §10 P0「混合支付」的結帳面板——取代原本「選一種付款方式
// →彈出一次性確認框」的單一支付流程。這裡讓操作員可以加入多筆支付
// （例如現金 60 元＋信用卡 100 元付一筆 160 元的單），現金支付可以另外
// 填「實收金額」讓面板即時算出找零，實收與分擔金額分開輸入（見
// @pos/contract 的 tenderInputSchema 說明：amount 是這筆支付分擔多少
// 應付金額，receivedAmount 是客人實際給了多少，兩者不是同一件事）。
//
// 這個元件只管「湊出一組合法的 tenders」，實際送單（呼叫
// buildCreateOrderRequest／enqueueOrder）留在 views/home/index.vue，
// 面板本身不知道訂單的其他細節（品項、折扣），保持職責單一。
//
// P17（視覺重構收尾）：這個元件從 P6／P9 建立以來就沒有補上深色模式
// 與語意色 token（success／danger），是 P11 那一輪全站重構掃描時的
// 漏網之魚——它是結帳流程裡最常用的對話框，卻剛好在 P11 之前就已經
// 存在、之後也沒有再被修改過，沒有觸發那一輪的檢查。找零／移除支付
// 兩處原本直接寫 text-emerald-600／text-red-600，改用 success／danger
// token，跟 order/index.vue 等其他頁面一致。
import { computed, ref, watch } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
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

const tenderedAmount = computed(() => tenders.value.reduce((sum, tender) => sum + tender.amount, 0))
const remaining = computed(() => Math.max(0, props.dueAmount - tenderedAmount.value))
// 找零只在剛好付清（remaining 為 0）時才有意義顯示——尚未付清前，
// 提早顯示現金 tender 的找零容易被誤讀成「已經找過的零錢」。
const changeDue = computed(() =>
  tenders.value.reduce((sum, tender) => sum + ((tender.receivedAmount ?? tender.amount) - tender.amount), 0),
)

const canAddDraftTender = computed(() => {
  if (!draftMethod.value) return false
  if (draftAmount.value <= 0 && remaining.value > 0) return false
  if (draftAmount.value > remaining.value) return false
  if (draftReceivedAmount.value !== undefined && draftReceivedAmount.value < draftAmount.value) return false
  return true
})

function selectDraftMethod(method: PaymentMethod) {
  draftMethod.value = method
  draftAmount.value = remaining.value
  draftReceivedAmount.value = undefined
}

function addDraftTender() {
  if (!draftMethod.value || !canAddDraftTender.value) return
  tenders.value.push({
    method: draftMethod.value.name,
    amount: draftAmount.value,
    ...(draftReceivedAmount.value ? { receivedAmount: draftReceivedAmount.value } : {}),
  })
  draftMethod.value = undefined
  draftAmount.value = 0
  draftReceivedAmount.value = undefined
}

function removeTender(index: number) {
  tenders.value.splice(index, 1)
}

function submit() {
  if (remaining.value > 0 || tenders.value.length === 0) return
  emit('submit', tenders.value)
}

// 每次面板重新打開（例如上一筆訂單送出後，下一筆又點了付款）都要是
// 全新的一組 tenders，不能延續上一筆訂單殘留的加入紀錄。
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    tenders.value = []
    draftMethod.value = undefined
    draftAmount.value = props.dueAmount
    draftReceivedAmount.value = undefined
  },
)
</script>
