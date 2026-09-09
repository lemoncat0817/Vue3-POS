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
// ToastTitle 設 data-testid 避免 e2e getByText 同步比對到 Reka aria-live 隱藏文字
import { ToastClose, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { setToastOpen, useToastState } from '@/composables/useToast'

const state = useToastState()
</script>
