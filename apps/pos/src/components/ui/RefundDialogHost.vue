<template>
  <DialogRoot :open="state.open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-overlay focus:outline-none dark:bg-surface-900"
        @click.capture="onContentClick"
      >
        <DialogTitle class="text-lg font-bold text-surface-900 dark:text-surface-100"
          >退款</DialogTitle
        >
        <DialogDescription class="mt-2 text-sm text-surface-600 dark:text-surface-400">
          這筆訂單目前還能退
          <span class="font-bold text-primary-600 dark:text-primary-400">$ {{ state.max }}</span>
        </DialogDescription>
        <label class="mt-4 block text-xs font-bold text-surface-500 dark:text-surface-400">
          退款金額
          <input
            v-model.number="state.amount"
            type="number"
            min="1"
            :max="state.max"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </label>
        <label class="mt-3 block text-xs font-bold text-surface-500 dark:text-surface-400">
          退款原因
          <textarea
            v-model="state.reason"
            rows="2"
            placeholder="例如：少一份配料、顧客不滿意"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </label>
        <p v-if="!isValid" class="mt-2 text-xs font-bold text-danger-600 dark:text-danger-400">
          退款金額必須大於 0 且不超過 $ {{ state.max }}，並填寫原因
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <DialogClose as-child>
            <button
              type="button"
              data-refund-result="cancel"
              class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              取消
            </button>
          </DialogClose>
          <DialogClose as-child>
            <button
              type="button"
              data-refund-result="confirm"
              :disabled="!isValid"
              class="rounded-lg bg-danger-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              確認退款
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
// 全域退款對話框（掛載於 App.vue），透過 click.capture 預先記錄操作結果
import { computed, ref } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'
import { settleRefundPrompt, useRefundPromptState } from '@/composables/useRefund'

const state = useRefundPromptState()

const isValid = computed(
  () => state.amount > 0 && state.amount <= state.max && state.reason.trim() !== ''
)

const pendingResult = ref<'confirm' | 'cancel'>('cancel')
function onContentClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-refund-result]')
  if (target) {
    pendingResult.value = target.getAttribute('data-refund-result') as 'confirm' | 'cancel'
  }
}
function onOpenChange(open: boolean) {
  if (!open) {
    settleRefundPrompt(
      pendingResult.value === 'confirm' && isValid.value
        ? { amount: state.amount, reason: state.reason.trim() }
        : null
    )
    pendingResult.value = 'cancel'
  }
}
</script>
