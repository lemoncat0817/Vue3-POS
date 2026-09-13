<template>
  <DialogRoot :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-surface-900/60" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white text-surface-900 shadow-overlay focus:outline-none dark:bg-surface-900 dark:text-surface-100"
        :class="sizeClass"
      >
        <div class="flex shrink-0 items-center justify-between px-6 pt-6">
          <div>
            <DialogTitle class="text-lg font-bold">{{ title }}</DialogTitle>
            <DialogDescription
              v-if="description"
              class="mt-1 text-xs text-surface-500 dark:text-surface-400"
            >
              {{ description }}
            </DialogDescription>
            <DialogDescription v-else class="sr-only">{{ title }}</DialogDescription>
          </div>
          <DialogClose
            class="rounded-lg p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-500 dark:hover:text-surface-200 dark:hover:bg-surface-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
            aria-label="關閉"
            >✕</DialogClose
          >
        </div>
        <div class="mt-4 min-h-0 overflow-y-auto px-6 pt-1.5 pb-6">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    description: '',
    size: 'md'
  }
)
const emit = defineEmits<{ 'update:open': [boolean] }>()

const sizeClass = computed(
  () =>
    ({
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    })[props.size]
)
</script>
