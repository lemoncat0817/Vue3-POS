import { reactive } from 'vue'

/** 輕量 Toast 提示訊息（單一全域實例，基於 Reka UI Toast）。 */
export type ToastType = 'success' | 'error'

interface ToastState {
  open: boolean
  message: string
  type: ToastType
}

const state = reactive<ToastState>({
  open: false,
  message: '',
  type: 'success'
})

/** 給 ToastHost.vue 讀取目前要顯示的內容，不對外匯出。 */
export function useToastState() {
  return state
}

export function showToast(message: string, type: ToastType = 'success') {
  // 透過微任務重啟 open 狀態以重置自動關閉計時器。
  state.open = false
  queueMicrotask(() => {
    state.message = message
    state.type = type
    state.open = true
  })
}

/** ToastHost.vue 專用：使用者手動關閉、或計時到期時呼叫。 */
export function setToastOpen(open: boolean) {
  state.open = open
}
