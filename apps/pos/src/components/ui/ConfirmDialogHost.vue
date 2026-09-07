<template>
  <AlertDialogRoot :open="state.open" @update:open="onOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-surface-900/60" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl shadow-surface-900/30 focus:outline-none"
        @click.capture="onContentClick">
        <AlertDialogTitle class="text-lg font-bold text-surface-900">{{ state.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.description" class="mt-2 text-sm text-surface-600">
          {{ state.description }}
        </AlertDialogDescription>
        <div class="mt-6 flex justify-end gap-3">
          <AlertDialogCancel v-if="!state.singleButton" as-child>
            <button
              type="button"
              data-confirm-result="cancel"
              class="rounded-lg border border-surface-300 px-4 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100">
              {{ state.cancelText }}
            </button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <button
              type="button"
              data-confirm-result="confirm"
              class="rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors"
              :class="state.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'">
              {{ state.confirmText }}
            </button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
// P8：規劃書「組件庫替換」示範——取代 ElMessageBox.confirm，見
// composables/useConfirm.ts 的說明。整個 App 只掛一個實例（見
// App.vue），呼叫端不用各自管理開關狀態。
import { ref } from 'vue'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'
import { settleConfirm, useConfirmState, type ConfirmResult } from '@/composables/useConfirm'

const state = useConfirmState()

// AlertDialogAction／AlertDialogCancel 點下去時，Reka 本身也會觸發關閉
// （emit update:open(false)），跟這裡想記錄「使用者選了哪個」是同一個
// click 事件裡的兩件事——如果分別各自掛 @click 處理，執行順序不保證
// 哪個先跑，可能讓 update:open 先把這次選擇覆蓋成「dismiss」（實際發生
// 過：見 P8 commit 說明）。改成在 AlertDialogContent 這一層用
// click.capture（捕獲階段，一定比按鈕自己的 click 早執行、也不分滑鼠或
// 鍵盤觸發）先記下使用者按的是哪個按鈕，onOpenChange 只負責讀這個結果、
// 真正呼叫 settleConfirm——兩件事變成同一個地方、同一個順序處理，不再
// 用「兩個各自獨立的 handler 誰先誰後」這種不可靠的方式決定結果。
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
