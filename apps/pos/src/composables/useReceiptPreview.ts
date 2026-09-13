import { reactive } from 'vue'
import type { OrderRecord } from '@/types'

const state = reactive<{ open: boolean; order: OrderRecord | null }>({
  open: false,
  order: null
})

export function useReceiptPreviewState() {
  return state
}

export function showReceipt(order: OrderRecord) {
  state.order = order
  state.open = true
}

export function closeReceipt() {
  state.open = false
}
