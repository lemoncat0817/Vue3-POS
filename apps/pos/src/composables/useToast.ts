import { reactive } from 'vue'

/**
 * P8：取代 `ElMessage.success(...)`／`ElMessage.error(...)` 的輕量提示。
 * 同時間只顯示一則——跟現行 ElMessage 的實際使用方式一致（這個專案
 * 沒有同時疊多則訊息的情境），底層用 Reka UI 的 Toast 原語（見
 * components/ui/ToastHost.vue）處理 ARIA live region、自動關閉、
 * 滑鼠移入暫停計時等行為。
 */
export type ToastType = 'success' | 'error'

interface ToastState {
  open: boolean
  message: string
  type: ToastType
}

const state = reactive<ToastState>({
  open: false,
  message: '',
  type: 'success',
})

/** 給 ToastHost.vue 讀取目前要顯示的內容，不對外匯出。 */
export function useToastState() {
  return state
}

export function showToast(message: string, type: ToastType = 'success') {
  // 開－關－開能重新觸發 Reka Toast 的自動關閉計時器；同一個 tick 內
  // 直接改 message 不會重新計時，所以先關閉再等下一個 tick 開啟。
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
