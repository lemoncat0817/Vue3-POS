<template>
  <div class="grid grid-cols-3 gap-1.5">
    <button
      v-for="key in keys"
      :key="key.label"
      type="button"
      :disabled="disabled"
      class="rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 py-2.5 text-base font-bold text-surface-900 dark:text-surface-100 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      :class="key.action ? 'text-surface-500 dark:text-surface-400' : ''"
      @click="onKeyPress(key)"
    >
      {{ key.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// 金額一律整數（NTD 無小數），不用出現小數點鍵；面額固定用商用收銀機常見的
// 7-8-9／4-5-6／1-2-3／清除-0-退格排列，不是網頁表單由上到下 0-9 的順序。
interface Key {
  label: string
  digit?: string
  action?: 'clear' | 'backspace'
}
const keys: Key[] = [
  { label: '7', digit: '7' },
  { label: '8', digit: '8' },
  { label: '9', digit: '9' },
  { label: '4', digit: '4' },
  { label: '5', digit: '5' },
  { label: '6', digit: '6' },
  { label: '1', digit: '1' },
  { label: '2', digit: '2' },
  { label: '3', digit: '3' },
  { label: '清除', action: 'clear' },
  { label: '0', digit: '0' },
  { label: '⌫', action: 'backspace' }
]

const props = defineProps<{
  modelValue: number
  /** 有帶就在超過時擋下這次按鍵（例如分擔金額不能超過剩餘應付）。 */
  max?: number | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

function onKeyPress(key: Key) {
  if (key.action === 'clear') {
    emit('update:modelValue', 0)
    return
  }
  if (key.action === 'backspace') {
    const next = String(props.modelValue).slice(0, -1)
    emit('update:modelValue', next === '' ? 0 : Number(next))
    return
  }
  // Number() 會自動吃掉字串開頭的 0（例如 "0"+"5" 組成 "05" 會直接變成 5），
  // 不用額外處理「第一碼是 0」的情況。
  const next = Number(`${props.modelValue}${key.digit}`)
  if (props.max !== undefined && next > props.max) return
  emit('update:modelValue', next)
}
</script>
