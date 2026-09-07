<template>
  <label class="mb-4 block text-sm font-bold text-surface-700">
    {{ label }}
    <input
      :value="value"
      :type="type ?? 'text'"
      :step="step"
      :disabled="disabled"
      class="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-surface-900 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400"
      :class="errorMessage ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-surface-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'"
      :placeholder="placeholder"
      @input="handleChange"
      @blur="handleBlur" />
    <span v-if="errorMessage" class="mt-1 block text-xs font-bold text-red-600">{{ errorMessage }}</span>
  </label>
</template>

<script setup lang="ts">
// P8：規劃書「組件庫替換」示範——VeeValidate 的欄位共用元件。原本
// backgroundSetting/offerSetting 每個表單欄位的合法性都是送出當下才
// 用一連串 if/else + ElMessage.error() 逐條檢查（只回報第一個不合法
// 的規則），改成 VeeValidate + Zod（見 offerSetting/index.vue 的
// schema 定義），錯誤即時顯示在欄位下方，送出時一次驗證所有欄位。
import { useField } from 'vee-validate'

const props = defineProps<{
  name: string
  label: string
  placeholder?: string
  type?: string
  step?: string
  disabled?: boolean
}>()

const { value, errorMessage, handleChange, handleBlur } = useField<string | number>(() => props.name)
</script>
