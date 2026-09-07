<template>
  <DialogRoot :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl shadow-surface-900/30 focus:outline-none">
        <div class="flex items-center justify-between">
          <DialogTitle class="text-lg font-bold text-surface-900">{{ title }}</DialogTitle>
          <DialogClose class="text-surface-400 transition-colors hover:text-surface-700" aria-label="關閉">✕</DialogClose>
        </div>
        <div class="mt-4">
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
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
</script>
