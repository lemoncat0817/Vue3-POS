<template>
  <DialogRoot :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white text-surface-900 shadow-overlay focus:outline-none dark:bg-surface-900 dark:text-surface-100"
        :class="sizeClass">
        <div class="flex shrink-0 items-center justify-between px-6 pt-6">
          <DialogTitle class="text-lg font-bold">{{ title }}</DialogTitle>
          <DialogClose class="text-surface-400 dark:text-surface-500 transition-colors hover:text-surface-700 dark:hover:text-surface-200" aria-label="關閉">✕</DialogClose>
        </div>
        <div class="mt-4 min-h-0 overflow-y-auto px-6 pb-6">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
// P8：規劃書「組件庫替換」示範——通用的表單／內容彈出視窗（Reka UI
// Dialog），取代 el-dialog。跟 ConfirmDialogHost／ToastHost 不同，這裡
// 不是全 App 單例：每個要彈出視窗的頁面各自用自己的 open 狀態掛一個
// 實例（呼叫端本來就要管理「目前在編輯哪一筆」這類跟這次彈窗綁定的
// 本機狀態，沒有理由做成全域單例）。
//
// UI-0（規劃書 B-5）：原本只有 max-w-md、沒有 max-h 也沒有內部捲動——
// 內容一旦高過視窗，上下會被切掉且無法捲動（見 e2e/permission-admin.
// spec.ts、e2e/defect-fixes.spec.ts 用加大視窗高度繞過的註解）。現在
// 標題列與底部固定（shrink-0），內容區獨立捲動（min-h-0 overflow-
// y-auto），對話框本身用 max-h-[85vh] 頂住視窗高度，不管內容多長都
// 卡得住、也捲得到。size 決定寬度，預設 md 跟原本的 max-w-md 相同，
// 不影響既有呼叫端。
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{ open: boolean; title: string; size?: 'sm' | 'md' | 'lg' | 'xl' }>(), {
  size: 'md',
})
const emit = defineEmits<{ 'update:open': [boolean] }>()

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}[props.size]))
</script>
