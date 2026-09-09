import { reactive } from 'vue'

/**
 * 主管二次授權對話框（退款/作廢操作）。
 * 回傳 `{ account, pin } | null`，由呼叫端負責呼叫伺服端驗證身分與權限。
 */
export interface ManagerAuthOptions {
  title: string
  description: string
}

export interface ManagerAuthResult {
  account: string
  pin: string
}

interface ManagerAuthState {
  open: boolean
  title: string
  description: string
  account: string
  pin: string
  resolve: ((result: ManagerAuthResult | null) => void) | null
}

const state = reactive<ManagerAuthState>({
  open: false,
  title: '',
  description: '',
  account: '',
  pin: '',
  resolve: null,
})

export function useManagerAuthState() {
  return state
}

export function requestManagerAuth(options: ManagerAuthOptions): Promise<ManagerAuthResult | null> {
  return new Promise((resolve) => {
    state.resolve?.(null)
    state.title = options.title
    state.description = options.description
    state.account = ''
    state.pin = ''
    state.resolve = resolve
    state.open = true
  })
}

/** ManagerAuthDialogHost.vue 專用：使用者確認（回傳目前輸入的帳號／PIN）或取消／關閉（回傳 null）。 */
export function settleManagerAuth(result: ManagerAuthResult | null) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
