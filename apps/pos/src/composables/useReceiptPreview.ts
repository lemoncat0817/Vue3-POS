import { reactive } from 'vue'
import type { OrderRecord } from '@/types'

/** 收據預覽與列印對話框狀態管理（全域單一實例）。 */
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
