<template>
  <DialogRoot :open="state.open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-overlay focus:outline-none dark:bg-surface-900"
        @click.capture="onContentClick">
        <DialogTitle class="text-lg font-bold text-surface-900 dark:text-surface-100">{{ state.title }}</DialogTitle>
        <DialogDescription v-if="state.description" class="mt-2 text-sm text-surface-600 dark:text-surface-400">
          {{ state.description }}
        </DialogDescription>
        <label class="mt-4 block text-xs font-bold text-surface-500 dark:text-surface-400">
          {{ state.label }}
          <textarea
            v-model="state.value"
            rows="2"
            :placeholder="state.placeholder"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100" />
        </label>
        <div class="mt-6 flex justify-end gap-3">
          <DialogClose as-child>
            <button
              type="button"
              data-prompt-result="cancel"
              class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800">
              {{ state.cancelText }}
            </button>
          </DialogClose>
          <DialogClose as-child>
            <button
              type="button"
              data-prompt-result="confirm"
              :disabled="state.value.trim() === ''"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
              {{ state.confirmText }}
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
// P12（規劃書 §10 P0「退款／作廢」）：取代 `window.prompt()`，見
// composables/usePrompt.ts 的說明。整個 App 只掛一個實例（見
// App.vue），呼叫端不用各自管理開關狀態——跟 ConfirmDialogHost.vue
// 同一套模式，包含「用 click.capture 在同一個事件裡先記下按了哪個
// 按鈕，onOpenChange 只負責讀這個結果」這個避免競態的做法（見
// ConfirmDialogHost.vue 的說明，這裡是同一個問題、同一種解法）。
import { ref } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { settlePrompt, usePromptState } from '@/composables/usePrompt'

const state = usePromptState()

const pendingResult = ref<'confirm' | 'cancel'>('cancel')
function onContentClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-prompt-result]')
  if (target) {
    pendingResult.value = target.getAttribute('data-prompt-result') as 'confirm' | 'cancel'
  }
}
function onOpenChange(open: boolean) {
  if (!open) {
    const value = state.value.trim()
    settlePrompt(pendingResult.value === 'confirm' && value !== '' ? value : null)
    pendingResult.value = 'cancel'
  }
}
</script>
