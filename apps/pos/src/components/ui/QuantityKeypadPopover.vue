<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger as-child>
      <slot name="trigger" :open="isOpen" :count="currentCount">
        <!-- 預設觸發按鈕（若未自訂 slot） -->
        <button
          type="button"
          class="h-7 px-2.5 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-mono font-black text-sm flex items-center gap-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/60 hover:border-primary-400 active:scale-95 transition-all select-none cursor-pointer shadow-xs"
          :class="{ 'ring-2 ring-primary-500/40 border-primary-500': isOpen }"
          :disabled="disabled"
          title="點擊自訂數量 (開啟數字鍵盤)"
        >
          <span>{{ currentCount }}</span>
          <span class="text-[11px] font-bold text-primary-600/70 dark:text-primary-400/70">{{
            unit
          }}</span>
          <Keyboard class="w-3.5 h-3.5 text-primary-500/80 dark:text-primary-400/80" />
        </button>
      </slot>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        side="top"
        :side-offset="8"
        align="start"
        class="z-50 w-72 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3.5 shadow-overlay focus:outline-none select-none animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- 標題與關閉按鈕 -->
        <div
          class="flex items-center justify-between pb-2 mb-2 border-b border-surface-100 dark:border-surface-800"
        >
          <div
            class="flex items-center gap-1.5 text-xs font-bold text-surface-700 dark:text-surface-200"
          >
            <Calculator class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>自訂數量鍵盤</span>
          </div>
          <PopoverClose
            class="rounded-lg p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:text-surface-200 dark:hover:bg-surface-800 transition-colors cursor-pointer"
            aria-label="關閉"
          >
            <X class="w-3.5 h-3.5" />
          </PopoverClose>
        </div>

        <!-- 螢幕數值顯示框 -->
        <div
          class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 mb-2.5"
        >
          <span class="text-xs font-medium text-surface-400">目前設定</span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-bold hover:bg-surface-100 dark:hover:bg-surface-600 text-sm flex items-center justify-center active:scale-95 transition-all select-none cursor-pointer disabled:opacity-30"
              :disabled="!canStepDown"
              title="數量 -1"
              @click="stepDown"
            >
              -
            </button>
            <div class="flex items-baseline gap-1 min-w-[2.75rem] justify-center">
              <span
                class="text-xl font-black font-mono tracking-tight text-primary-600 dark:text-primary-400"
              >
                {{ displayTempValue }}
              </span>
              <span class="text-xs font-bold text-surface-500 dark:text-surface-400">{{ unit }}</span>
            </div>
            <button
              type="button"
              class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-bold hover:bg-surface-100 dark:hover:bg-surface-600 text-sm flex items-center justify-center active:scale-95 transition-all select-none cursor-pointer disabled:opacity-30"
              :disabled="!canStepUp"
              title="數量 +1"
              @click="stepUp"
            >
              +
            </button>
          </div>
        </div>

        <!-- 快速增量列 -->
        <div class="flex items-center justify-between gap-1 mb-2.5">
          <button
            v-for="inc in quickIncrements"
            :key="inc"
            type="button"
            class="flex-1 py-1 text-xs font-black font-mono rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100/80 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 dark:hover:text-primary-400 active:scale-95 transition-all cursor-pointer"
            @click="addIncrement(inc)"
          >
            +{{ inc }}
          </button>
        </div>

        <!-- 九宮格按鈕 (3 x 4) -->
        <div class="grid grid-cols-3 gap-1.5 mb-3">
          <button
            v-for="num in [7, 8, 9, 4, 5, 6, 1, 2, 3]"
            :key="num"
            type="button"
            class="h-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-black font-mono text-base flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 hover:border-surface-300 dark:hover:border-surface-600 active:scale-95 active:bg-primary-50 dark:active:bg-primary-950/60 transition-all shadow-xs cursor-pointer"
            @click="inputDigit(String(num))"
          >
            {{ num }}
          </button>

          <!-- 清除 (C) -->
          <button
            type="button"
            class="h-10 rounded-xl border border-danger-200 dark:border-danger-900/40 bg-danger-50/60 dark:bg-danger-950/30 text-danger-600 dark:text-danger-400 font-black font-mono text-sm flex items-center justify-center hover:bg-danger-100 dark:hover:bg-danger-900/50 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="清空重設為 1"
            @click="handleClear"
          >
            C
          </button>

          <!-- 0 -->
          <button
            type="button"
            class="h-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 font-black font-mono text-base flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 hover:border-surface-300 dark:hover:border-surface-600 active:scale-95 active:bg-primary-50 dark:active:bg-primary-950/60 transition-all shadow-xs cursor-pointer"
            @click="inputDigit('0')"
          >
            0
          </button>

          <!-- 退格 (⌫) -->
          <button
            type="button"
            class="h-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-bold flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 hover:border-surface-300 dark:hover:border-surface-600 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="退格刪除"
            @click="handleBackspace"
          >
            <Delete class="w-4 h-4" />
          </button>
        </div>

        <!-- 底部確認與取消 -->
        <div
          class="flex items-center gap-2 pt-1 border-t border-surface-100 dark:border-surface-800"
        >
          <button
            type="button"
            class="flex-1 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs font-bold hover:bg-surface-50 dark:hover:bg-surface-700 active:scale-95 transition-all cursor-pointer"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="button"
            class="flex-[2] py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black shadow-md shadow-primary-600/25 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            @click="handleConfirm"
          >
            <Check class="w-3.5 h-3.5" />
            <span>確認數量 (Enter)</span>
          </button>
        </div>

        <PopoverArrow class="fill-white dark:fill-surface-900 drop-shadow-sm" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger
} from 'reka-ui'
import { Calculator, Check, Delete, Keyboard, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    min?: number
    max?: number
    quickIncrements?: number[]
    unit?: string
    disabled?: boolean
  }>(),
  {
    min: 1,
    max: 999,
    quickIncrements: () => [5, 10, 20, 50],
    unit: '份',
    disabled: false
  }
)

const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'confirm', val: number): void
}>()

const currentCount = computed(() => {
  const n = parseInt(String(props.modelValue))
  return isNaN(n) || n < props.min ? props.min : Math.min(n, props.max)
})

const tempValue = ref(String(currentCount.value))
const isFirstInput = ref(true)

const displayTempValue = computed(() => {
  return tempValue.value || String(props.min)
})

const resetTempToCurrent = () => {
  tempValue.value = String(currentCount.value)
  isFirstInput.value = true
}

const inputDigit = (digit: string) => {
  if (isFirstInput.value) {
    if (digit === '0') {
      return
    }
    tempValue.value = digit
    isFirstInput.value = false
  } else {
    const nextStr = tempValue.value + digit
    const nextNum = parseInt(nextStr)
    if (!isNaN(nextNum) && nextNum <= props.max) {
      tempValue.value = nextStr
    }
  }
}

const canStepDown = computed(() => {
  const current = parseInt(tempValue.value) || props.min
  return current > props.min
})

const canStepUp = computed(() => {
  const current = parseInt(tempValue.value) || props.min
  return current < props.max
})

const stepDown = () => {
  const current = parseInt(tempValue.value) || props.min
  if (current > props.min) {
    tempValue.value = String(current - 1)
    isFirstInput.value = false
  }
}

const stepUp = () => {
  const current = parseInt(tempValue.value) || props.min
  if (current < props.max) {
    tempValue.value = String(current + 1)
    isFirstInput.value = false
  }
}

const addIncrement = (inc: number) => {
  const current = parseInt(tempValue.value) || 0
  const next = Math.min(current + inc, props.max)
  tempValue.value = String(next)
  isFirstInput.value = false
}

const handleBackspace = () => {
  if (isFirstInput.value) {
    tempValue.value = ''
    isFirstInput.value = false
    return
  }
  if (tempValue.value.length > 1) {
    tempValue.value = tempValue.value.slice(0, -1)
  } else {
    tempValue.value = ''
    isFirstInput.value = true
  }
}

const handleClear = () => {
  tempValue.value = String(props.min)
  isFirstInput.value = true
}

const handleCancel = () => {
  isOpen.value = false
}

const handleConfirm = () => {
  const parsed = parseInt(tempValue.value)
  const finalVal = isNaN(parsed) || parsed < props.min ? props.min : Math.min(parsed, props.max)
  emit('update:modelValue', String(finalVal))
  emit('confirm', finalVal)
  isOpen.value = false
}

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return

  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    inputDigit(e.key)
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    stepUp()
  } else if (e.key === '-') {
    e.preventDefault()
    stepDown()
  } else if (e.key === 'Backspace') {
    e.preventDefault()
    handleBackspace()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    handleConfirm()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    handleCancel()
  }
}

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      resetTempToCurrent()
      window.addEventListener('keydown', handleGlobalKeydown)
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown)
    }
  }
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})


</script>
