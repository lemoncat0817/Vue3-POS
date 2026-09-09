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
// 通用彈出視窗；標題列固定、內容區 min-h-0 overflow-y-auto 搭配 max-h-[85vh] 獨立捲動
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
