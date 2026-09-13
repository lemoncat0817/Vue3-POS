import { reactive } from 'vue'

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

export function setToastOpen(open: boolean) {
  state.open = open
}
