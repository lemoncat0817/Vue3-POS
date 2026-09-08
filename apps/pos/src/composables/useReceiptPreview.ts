import { reactive } from 'vue'
import type { OrderRecord } from '@/types'

/**
 * 收據預覽／列印（P16：規劃書 §10 P0「周邊模擬」）。
 *
 * 這個專案沒有真正的出單機（熱感應印表機）可以接，「列印收據」在
 * 瀏覽器能做到的極限就是叫出系統列印對話框——熱感應印表機在作業系統
 * 層級本來就是以一台印表機的身份出現，`window.print()` 這個瀏覽器
 * 內建能力本身就是跟真正的出單機互動的正確方式，不是另外找一個假的
 * 模擬按鈕。跟 ConfirmDialogHost／ToastHost 同一套模式：全 App 只掛
 * 一個 ReceiptPreviewDialogHost 實例，呼叫端不用各自管理開關狀態。
 */
const state = reactive<{ open: boolean; order: OrderRecord | null }>({
  open: false,
  order: null,
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
