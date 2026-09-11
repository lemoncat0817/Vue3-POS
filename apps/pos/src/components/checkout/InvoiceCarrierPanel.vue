<template>
  <button
    type="button"
    v-bind="$attrs"
    class="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-1 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 active:scale-95 transition-all shadow-sm flex items-center justify-center text-center select-none"
    data-testid="invoice-carrier-button"
    @click="openDialog"
  >
    {{ triggerLabel }}
  </button>

  <ModalDialog :open="open" title="發票載具" @update:open="onOpenChange">
    <div class="flex flex-col gap-3">
      <p class="text-xs text-surface-500 dark:text-surface-400">
        選擇這張發票怎麼開立，預設是無載具（紙本發票）。
      </p>
      <div class="flex gap-2">
        <button
          v-for="option in typeOptions"
          :key="option"
          type="button"
          class="flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors"
          :class="
            draftType === option
              ? 'bg-primary-600 text-white'
              : 'border border-surface-300 text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800'
          "
          @click="selectType(option)"
        >
          {{ option }}
        </button>
      </div>
      <label
        v-if="draftType !== '無載具'"
        class="block text-xs font-bold text-surface-500 dark:text-surface-400"
      >
        {{ draftType === '手機條碼' ? '手機條碼（「/」開頭＋7碼）' : '統一編號（8碼數字）' }}
        <input
          v-model="draftValue"
          type="text"
          :placeholder="draftType === '手機條碼' ? '/ABC1234' : '12345678'"
          class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        />
      </label>
      <p v-if="errorMessage" class="text-xs font-bold text-danger-600 dark:text-danger-400">
        {{ errorMessage }}
      </p>
      <div class="mt-2 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
          @click="open = false"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="!isValid"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="confirm-invoice-carrier"
          @click="confirm"
        >
          確定
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
// 載具格式驗證重用 @pos/contract 的 invoiceCarrierSchema
import { computed, ref } from 'vue'
import ModalDialog from '@/components/ui/ModalDialog.vue'
import { invoiceCarrierSchema, type InvoiceCarrier, type InvoiceCarrierType } from '@pos/contract'

const props = defineProps<{ modelValue: InvoiceCarrier }>()
const emit = defineEmits<{ 'update:modelValue': [InvoiceCarrier] }>()

const typeOptions: InvoiceCarrierType[] = ['無載具', '手機條碼', '統一編號']

const open = ref(false)
const draftType = ref<InvoiceCarrierType>('無載具')
const draftValue = ref('')

const triggerLabel = computed(() => {
  if (props.modelValue.type === '無載具') return '載具'
  if (props.modelValue.type === '手機條碼') return '載具：手機'
  return '載具：統編'
})

function openDialog() {
  draftType.value = props.modelValue.type
  draftValue.value = props.modelValue.type === '無載具' ? '' : props.modelValue.value
  open.value = true
}

function selectType(type: InvoiceCarrierType) {
  draftType.value = type
  draftValue.value = ''
}

const draft = computed<InvoiceCarrier>(() =>
  draftType.value === '無載具'
    ? { type: '無載具' }
    : { type: draftType.value, value: draftValue.value }
)
const validation = computed(() => invoiceCarrierSchema.safeParse(draft.value))
const isValid = computed(() => validation.value.success)
// 避免輸入前即顯示格式錯誤
const errorMessage = computed(() => {
  if (validation.value.success || draftType.value === '無載具' || draftValue.value === '')
    return null
  return validation.value.error.issues[0]?.message ?? '格式錯誤'
})

function onOpenChange(value: boolean) {
  open.value = value
}

function confirm() {
  if (!isValid.value) return
  emit('update:modelValue', draft.value)
  open.value = false
}
</script>
