<template>
  <AlertDialogRoot :open="state.open" @update:open="onOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-[60] bg-surface-900/60" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-overlay focus:outline-none dark:bg-surface-900"
        @click.capture="onContentClick"
      >
        <AlertDialogTitle class="text-lg font-bold text-surface-900 dark:text-surface-100">{{
          state.title
        }}</AlertDialogTitle>
        <AlertDialogDescription
          v-if="state.description"
          class="mt-2 text-sm text-surface-600 dark:text-surface-400"
        >
          {{ state.description }}
        </AlertDialogDescription>
        <div class="mt-6 flex justify-end gap-3">
          <AlertDialogCancel v-if="!state.singleButton" as-child>
            <button
              type="button"
              data-confirm-result="cancel"
              class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              {{ state.cancelText }}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <button
              type="button"
              data-confirm-result="confirm"
              class="rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors"
              :class="
                state.variant === 'danger'
                  ? 'bg-danger-600 hover:bg-danger-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              "
            >
              {{ state.confirmText }}
            </button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle
} from 'reka-ui'
import { settleConfirm, useConfirmState, type ConfirmResult } from '@/composables/useConfirm'

const state = useConfirmState()

// 用 click.capture 先捕獲按鈕結果，避免與 update:open 觸發順序產生競態
const pendingResult = ref<ConfirmResult>('dismiss')
function onContentClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-confirm-result]')
  if (target) {
    pendingResult.value = target.getAttribute('data-confirm-result') as ConfirmResult
  }
}
function onOpenChange(open: boolean) {
  if (!open) {
    settleConfirm(pendingResult.value)
    pendingResult.value = 'dismiss'
  }
}
</script>
