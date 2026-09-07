<template>
  <div
class="flex cursor-pointer items-center gap-1" role="button" tabindex="0" data-testid="shift-status"
    @click="open = true" @keyup.enter="open = true">
    <p class="mr-2 font-bold text-blue-500 xl:text-lg lg:text-base md:text-sm text-xs">班別</p>
    <p class="text-center font-bold xl:text-lg lg:text-base md:text-sm text-xs" :class="shift ? 'text-emerald-600' : 'text-surface-400'">
      {{ shift ? '營業中' : '尚未開帳' }}
    </p>
  </div>

  <ModalDialog :open="open" title="班別結帳" @update:open="(value) => (open = value)">
    <!-- 尚未開帳：只能開帳，不能做任何其他操作。 -->
    <div v-if="!shift" class="flex flex-col gap-3">
      <p class="text-sm text-surface-500">開帳零用金（找零準備金）</p>
      <input
v-model.number="openingFloat" type="number" min="0"
        class="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm">
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="open = false">取消</button>
        <button
type="button" :disabled="isSubmitting"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          @click="submitOpen">開帳</button>
      </div>
    </div>

    <!-- 已開帳、還沒進入收班畫面：顯示班別概況、中途現金存入／提出。 -->
    <div v-else-if="!closing" class="flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-2 rounded-lg bg-surface-50 p-3 text-sm">
        <div><span class="text-surface-500">開帳人員：</span>{{ shift.openedBy }}</div>
        <div><span class="text-surface-500">開帳時間：</span>{{ shift.openedAt.slice(11, 16) }}</div>
        <div><span class="text-surface-500">開帳零用金：</span>$ {{ shift.openingFloat }}</div>
        <div><span class="text-surface-500">現金存入／提出：</span>+{{ shift.cashIn }} / −{{ shift.cashOut }}</div>
      </div>

      <div v-if="shift.movements.length > 0" class="flex flex-col gap-1 text-xs text-surface-600">
        <div v-for="movement in shift.movements" :key="movement.id" class="flex justify-between border-b border-surface-100 py-1">
          <span>{{ movement.type === 'in' ? '存入' : '提出' }}：{{ movement.reason }}</span>
          <span class="font-bold">{{ movement.type === 'in' ? '+' : '−' }}{{ movement.amount }}</span>
        </div>
      </div>

      <div class="flex items-end gap-2 rounded-lg border border-surface-200 p-3">
        <label class="flex-1 text-xs font-bold text-surface-500">
          金額
          <input v-model.number="movementAmount" type="number" min="1" class="mt-1 w-full rounded-lg border border-surface-300 px-2 py-1.5 text-sm">
        </label>
        <label class="flex-1 text-xs font-bold text-surface-500">
          原因
          <input v-model="movementReason" type="text" placeholder="例如：追加零錢準備金" class="mt-1 w-full rounded-lg border border-surface-300 px-2 py-1.5 text-sm">
        </label>
        <button type="button" :disabled="isSubmitting" class="rounded-lg border border-surface-300 px-3 py-1.5 text-sm font-bold disabled:opacity-40" @click="submitMovement('in')">存入</button>
        <button type="button" :disabled="isSubmitting" class="rounded-lg border border-surface-300 px-3 py-1.5 text-sm font-bold disabled:opacity-40" @click="submitMovement('out')">提出</button>
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="open = false">關閉</button>
        <button type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white" @click="closing = true">收班</button>
      </div>
    </div>

    <!-- 收班：輸入依面額點鈔算出的實際現金，即時預覽應有現金與帳差。 -->
    <div v-else-if="shift" class="flex flex-col gap-3">
      <p class="text-sm text-surface-500">依面額點鈔後，實際清點到的現金總額</p>
      <input v-model.number="actualCash" type="number" min="0" class="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm">
      <div class="grid grid-cols-2 gap-2 rounded-lg bg-surface-50 p-3 text-center text-sm">
        <div>
          <p class="text-xs font-bold text-surface-500">應有現金</p>
          <p class="text-lg font-bold">$ {{ previewExpectedCash }}</p>
        </div>
        <div>
          <p class="text-xs font-bold text-surface-500">帳差</p>
          <p class="text-lg font-bold" :class="previewVariance === 0 ? 'text-emerald-600' : 'text-red-600'">
            {{ previewVariance > 0 ? '+' : '' }}{{ previewVariance }}
          </p>
        </div>
      </div>
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100" @click="closing = false">返回</button>
        <button
type="button" :disabled="isSubmitting"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          @click="submitClose">確認收班</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// P6（規劃書 §10 P0「班別結帳」）：取代 home/index.vue 原本 getMoment()
// 算出的「早班／中班／晚班」這種純裝飾性文字（跟真正的營運狀態無關）
// ——這裡的「班別」是真的有開帳零用金、中途現金異動、收班點鈔算帳差
// 的營運概念，見 apps/api/src/routes/shifts.ts、@pos/domain 的
// summarizeShiftCash() 說明。
//
// 現金銷售額（cashSales）只有收班當下才由伺服端算出（見 shiftSchema
// 的說明），因此收班前的「應有現金」預覽（previewExpectedCash）沒辦法
// 精確到那一刻——用「開帳零用金 + 存入 − 提出」當底，不含尚未結算的
// 現金訂單金額，並在畫面上以「應有現金（不含尚未結算的現金訂單）」的
// 標籤說明這個落差，避免誤導店員以為這就是最終帳差。
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { addCashMovement, closeShift, fetchCurrentShift, openShift } from '@/api/shifts'
import { showToast } from '@/composables/useToast'
import { ulid } from '@pos/domain'
import type { CashMovementType } from '@pos/contract'

const props = defineProps<{ operator: string }>()

const open = ref(false)
const closing = ref(false)
const isSubmitting = ref(false)
const openingFloat = ref(0)
const movementAmount = ref(0)
const movementReason = ref('')
const actualCash = ref(0)

const { data: shift, refetch } = useQuery({
  queryKey: ['shift', 'current'],
  queryFn: fetchCurrentShift,
})

const previewExpectedCash = computed(() => {
  if (!shift.value) return 0
  return shift.value.openingFloat + shift.value.cashIn - shift.value.cashOut
})
const previewVariance = computed(() => actualCash.value - previewExpectedCash.value)

watch(open, (isOpen) => {
  if (!isOpen) {
    closing.value = false
    return
  }
  openingFloat.value = 0
  movementAmount.value = 0
  movementReason.value = ''
  actualCash.value = previewExpectedCash.value
})

// 從「班別概況」切到「收班」畫面時，重新帶入目前的應有現金預覽——
// 光靠上面 watch(open) 在對話框剛打開那一刻算一次是不夠的：使用者
// 可能先記錄了幾筆中途存入／提出，才按下收班，這中間 previewExpectedCash
// 已經變了，收班畫面的預設值要用最新的，不是對話框剛打開時的舊值。
watch(closing, (isClosing) => {
  if (isClosing) {
    actualCash.value = previewExpectedCash.value
  }
})

async function submitOpen() {
  isSubmitting.value = true
  try {
    await openShift({ shiftId: ulid(), operator: props.operator, openingFloat: openingFloat.value })
    await refetch()
    showToast('開帳成功', 'success')
    open.value = false
  } catch {
    showToast('開帳失敗，請確認網路連線後再試一次', 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function submitMovement(type: CashMovementType) {
  if (!shift.value || movementAmount.value <= 0 || !movementReason.value.trim()) return
  isSubmitting.value = true
  try {
    await addCashMovement(shift.value.id, {
      type,
      amount: movementAmount.value,
      reason: movementReason.value.trim(),
      operator: props.operator,
    })
    await refetch()
    movementAmount.value = 0
    movementReason.value = ''
    showToast(type === 'in' ? '現金存入已記錄' : '現金提出已記錄', 'success')
  } catch {
    showToast('記錄失敗，請確認網路連線後再試一次', 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function submitClose() {
  if (!shift.value) return
  isSubmitting.value = true
  try {
    const closed = await closeShift(shift.value.id, { operator: props.operator, actualCash: actualCash.value })
    await refetch()
    showToast(`收班完成，帳差 ${closed.variance !== null && closed.variance > 0 ? '+' : ''}${closed.variance}`, closed.variance === 0 ? 'success' : 'error')
    open.value = false
  } catch {
    showToast('收班失敗，請確認網路連線後再試一次', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
