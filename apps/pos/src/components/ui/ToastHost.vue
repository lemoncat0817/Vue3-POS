<template>
  <ToastProvider :duration="3000">
    <ToastRoot
      :open="state.open"
      class="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-overlay"
      :class="state.type === 'success'
        ? 'border-success-200 bg-success-50 text-success-900 dark:border-success-800 dark:bg-success-950 dark:text-success-100'
        : 'border-danger-200 bg-danger-50 text-danger-900 dark:border-danger-800 dark:bg-danger-950 dark:text-danger-100'"
      @update:open="setToastOpen">
      <ToastTitle data-testid="toast-message" class="text-sm font-bold">{{ state.message }}</ToastTitle>
      <ToastClose class="ml-auto text-xs font-bold opacity-60 hover:opacity-100" aria-label="關閉">✕</ToastClose>
    </ToastRoot>
    <ToastViewport class="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2 outline-none" />
  </ToastProvider>
</template>

<script setup lang="ts">
// P8：規劃書「組件庫替換」示範——取代 ElMessage，見 composables/
// useToast.ts 的說明。整個 App 只掛一個實例（見 App.vue）。
//
// ToastTitle 標了 data-testid：Reka Toast 為了無障礙會另外渲染一份
// aria-live 的隱藏播報文字（跟畫面上看到的文字內容相同），e2e 測試若用
// getByText() 找訊息文字，會同時比對到這份隱藏文字跟畫面上這份，出現
// strict mode violation——用 testid 精準指到畫面上這一份。
import { ToastClose, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { setToastOpen, useToastState } from '@/composables/useToast'

const state = useToastState()
</script>
