<template>
  <button
    type="button"
    v-bind="$attrs"
    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
    :class="{
      'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300':
        modelValue
    }"
    data-testid="member-button"
    @click="openDialog"
  >
    {{ triggerLabel }}
  </button>

  <ModalDialog :open="open" title="會員" @update:open="onOpenChange">
    <div v-if="modelValue" class="flex flex-col gap-3">
      <p class="text-sm text-surface-700 dark:text-surface-300">
        這筆訂單將計入會員
        <span class="font-bold text-primary-600 dark:text-primary-400">{{ modelValue.name }}</span>
        （{{ modelValue.phone }}，目前 {{ modelValue.points }} 點）
      </p>
      <label class="block text-xs font-bold text-surface-500 dark:text-surface-400">
        使用點數折抵（目前 {{ modelValue.points }} 點，每 {{ redemptionRate }} 點折抵 1 元）
        <input
          :value="pointsToRedeem"
          type="number"
          min="0"
          :max="modelValue.points"
          step="1"
          data-testid="points-to-redeem-input"
          class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          @input="onPointsToRedeemInput"
        />
      </label>
      <p v-if="pointsToRedeem > 0" class="text-xs text-surface-500 dark:text-surface-400">
        折抵 {{ pointsToRedeem }} 點 = <span class="font-bold text-danger-600 dark:text-danger-400">-{{ redemptionValue }} 元</span>
      </p>
      <div class="mt-2 flex justify-end gap-2">
        <button
          type="button"
          data-testid="unset-member"
          class="rounded-lg border border-danger-200 px-4 py-2 text-sm font-bold text-danger-600 hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950"
          @click="unsetMember"
        >
          取消計入會員
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          @click="open = false"
        >
          關閉
        </button>
      </div>
    </div>
    <div v-else class="flex flex-col gap-3">
      <p class="text-xs text-surface-500 dark:text-surface-400">
        輸入顧客手機號碼查詢會員，這筆訂單完成後會依金額累加點數；沒有這個會員可以直接建立新會員。
      </p>
      <label class="block text-xs font-bold text-surface-500 dark:text-surface-400">
        手機號碼
        <input
          v-model="phoneInput"
          type="text"
          placeholder="0912345678"
          data-testid="member-phone-input"
          class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        />
      </label>
      <div class="flex justify-end">
        <button
          type="button"
          :disabled="phoneInput.trim() === '' || isSearching"
          data-testid="search-member"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          @click="search"
        >
          查詢
        </button>
      </div>

      <div
        v-if="searchResult === 'not-found'"
        class="rounded-lg border border-surface-200 p-3 dark:border-surface-700"
      >
        <p class="text-sm text-surface-700 dark:text-surface-300">查無這個手機號碼的會員。</p>
        <label class="mt-2 block text-xs font-bold text-surface-500 dark:text-surface-400">
          姓名
          <input
            v-model="newMemberName"
            type="text"
            placeholder="例如: 王小明"
            data-testid="new-member-name"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </label>
        <div class="mt-2 flex justify-end">
          <button
            type="button"
            :disabled="newMemberName.trim() === ''"
            data-testid="create-member"
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            @click="createNewMember"
          >
            建立會員並計入這筆訂單
          </button>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// 結帳當下查會員或直接建檔，避免打斷結帳流程
import { computed, ref } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { showToast } from '@/composables/useToast'
import { apiErrorMessage } from '@/api/http'
import { createMember, findMemberByPhone } from '@/api/members'
import { redemptionValueForPoints } from '@pos/domain'
import type { Member } from '@pos/contract'

const props = defineProps<{
  modelValue: Member | null
  pointsToRedeem: number
  redemptionRate: number
}>()
const emit = defineEmits<{
  'update:modelValue': [Member | null]
  'update:pointsToRedeem': [number]
}>()

const open = ref(false)
const phoneInput = ref('')
const newMemberName = ref('')
const isSearching = ref(false)
const searchResult = ref<'idle' | 'not-found'>('idle')

const redemptionValue = computed(() =>
  redemptionValueForPoints(props.pointsToRedeem, props.redemptionRate)
)
const triggerLabel = computed(() => {
  if (!props.modelValue) return '會員'
  return props.pointsToRedeem > 0
    ? `會員：${props.modelValue.name}（折抵${props.pointsToRedeem}點）`
    : `會員：${props.modelValue.name}`
})

function openDialog() {
  phoneInput.value = ''
  newMemberName.value = ''
  searchResult.value = 'idle'
  open.value = true
}
function onOpenChange(value: boolean) {
  open.value = value
}

function onPointsToRedeemInput(event: Event) {
  if (!props.modelValue) return
  const raw = Math.floor(Number((event.target as HTMLInputElement).value))
  const clamped = Math.min(Math.max(0, Number.isFinite(raw) ? raw : 0), props.modelValue.points)
  emit('update:pointsToRedeem', clamped)
}

async function search() {
  if (phoneInput.value.trim() === '') return
  isSearching.value = true
  try {
    const found = await findMemberByPhone(phoneInput.value.trim())
    if (found) {
      emit('update:modelValue', found)
      emit('update:pointsToRedeem', 0)
      open.value = false
    } else {
      searchResult.value = 'not-found'
    }
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    isSearching.value = false
  }
}

async function createNewMember() {
  if (newMemberName.value.trim() === '') return
  try {
    const created = await createMember({
      name: newMemberName.value.trim(),
      phone: phoneInput.value.trim()
    })
    emit('update:modelValue', created)
    emit('update:pointsToRedeem', 0)
    showToast('會員建立成功', 'success')
    open.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  }
}

function unsetMember() {
  emit('update:modelValue', null)
  emit('update:pointsToRedeem', 0)
  open.value = false
}
</script>
