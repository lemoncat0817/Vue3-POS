<template>
  <ToastProvider :duration="3000">
    <ToastRoot
      :open="state.open"
      class="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg"
      :class="state.type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-red-200 bg-red-50 text-red-900'"
      @update:open="setToastOpen">
      <ToastTitle class="text-sm font-bold">{{ state.message }}</ToastTitle>
      <ToastClose class="ml-auto text-xs font-bold opacity-60 hover:opacity-100" aria-label="關閉">✕</ToastClose>
    </ToastRoot>
    <ToastViewport class="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2 outline-none" />
  </ToastProvider>
</template>

<script setup lang="ts">
// P8：規劃書「組件庫替換」示範——取代 ElMessage，見 composables/
// useToast.ts 的說明。整個 App 只掛一個實例（見 App.vue）。
import { ToastClose, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { setToastOpen, useToastState } from '@/composables/useToast'

const state = useToastState()
</script>
