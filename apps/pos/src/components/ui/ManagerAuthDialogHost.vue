<template>
  <DialogRoot :open="state.open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-overlay focus:outline-none dark:bg-surface-900"
        @click.capture="onContentClick"
      >
        <DialogTitle class="text-lg font-bold text-surface-900 dark:text-surface-100">{{
          state.title
        }}</DialogTitle>
        <DialogDescription class="mt-2 text-sm text-surface-600 dark:text-surface-400">{{
          state.description
        }}</DialogDescription>
        <label class="mt-4 block text-xs font-bold text-surface-500 dark:text-surface-400">
          帳號
          <input
            v-model="state.account"
            type="text"
            autocomplete="off"
            placeholder="有權限核可的帳號"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </label>
        <label class="mt-3 block text-xs font-bold text-surface-500 dark:text-surface-400">
          PIN
          <input
            v-model="state.pin"
            type="password"
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            placeholder="請輸入 PIN"
            class="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </label>
        <p v-if="!isValid" class="mt-2 text-xs font-bold text-danger-600 dark:text-danger-400">
          請輸入帳號與 PIN
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <DialogClose as-child>
            <button
              type="button"
              data-manager-auth-result="cancel"
              class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              取消
            </button>
          </DialogClose>
          <DialogClose as-child>
            <button
              type="button"
              data-manager-auth-result="confirm"
              :disabled="!isValid"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              確認核可
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
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
import { settleManagerAuth, useManagerAuthState } from '@/composables/useManagerAuth'

const state = useManagerAuthState()

const isValid = computed(() => state.account.trim() !== '' && state.pin.trim() !== '')

const pendingResult = ref<'confirm' | 'cancel'>('cancel')
function onContentClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-manager-auth-result]')
  if (target) {
    pendingResult.value = target.getAttribute('data-manager-auth-result') as 'confirm' | 'cancel'
  }
}
function onOpenChange(open: boolean) {
  if (!open) {
    settleManagerAuth(
      pendingResult.value === 'confirm' && isValid.value
        ? { account: state.account.trim(), pin: state.pin.trim() }
        : null
    )
    pendingResult.value = 'cancel'
  }
}
</script>
