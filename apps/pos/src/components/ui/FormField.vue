<template>
  <label class="mb-4 block text-sm font-bold text-surface-700 dark:text-surface-300">
    {{ label }}
    <input
      :value="value"
      :type="type ?? 'text'"
      :inputmode="inputmode"
      :step="step"
      :maxlength="maxlength"
      :disabled="disabled"
      class="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal text-surface-900 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 dark:bg-surface-800 dark:text-surface-100 dark:disabled:bg-surface-900 dark:disabled:text-surface-600"
      :class="
        errorMessage
          ? 'border-danger-400 focus:border-danger-500 focus:ring-1 focus:ring-danger-500'
          : 'border-surface-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700'
      "
      :placeholder="placeholder"
      @input="handleChange"
      @blur="handleBlur"
    />
    <span
      v-if="errorMessage"
      class="mt-1 block text-xs font-bold text-danger-600 dark:text-danger-400"
      >{{ errorMessage }}</span
    >
  </label>
</template>

<script setup lang="ts">
// VeeValidate 表單欄位元件，提供即時錯誤提示
import { useField } from 'vee-validate'

const props = defineProps<{
  name: string
  label: string
  placeholder?: string
  type?: string
  inputmode?: 'numeric' | 'decimal'
  step?: string
  maxlength?: number
  disabled?: boolean
}>()

const { value, errorMessage, handleChange, handleBlur } = useField<string | number>(
  () => props.name
)
</script>
