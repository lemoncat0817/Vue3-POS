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
  const next = Number(`${props.modelValue}${key.digit}`)
  if (props.max !== undefined && next > props.max) return
  emit('update:modelValue', next)
}
</script>
