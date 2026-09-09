import { reactive } from 'vue'

/**
 * 退款對話框（包含金額與原因輸入）。
 * 回傳 `{ amount, reason } | null`，前端做基本金額上限檢驗，伺服端做最終驗證。
 */
export interface RefundPromptOptions {
  /** 這筆訂單目前還能退的金額——輸入框的上限，畫面上也會顯示給店員看。 */
  max: number
}

export interface RefundPromptResult {
  amount: number
  reason: string
}

interface RefundState {
  open: boolean
  max: number
  amount: number
  reason: string
  resolve: ((result: RefundPromptResult | null) => void) | null
}

const state = reactive<RefundState>({
  open: false,
  max: 0,
  amount: 0,
  reason: '',
  resolve: null,
})

export function useRefundPromptState() {
  return state
}

export function requestRefund(options: RefundPromptOptions): Promise<RefundPromptResult | null> {
  return new Promise((resolve) => {
    state.resolve?.(null)
    state.max = options.max
    state.amount = options.max
    state.reason = ''
    state.resolve = resolve
    state.open = true
  })
}

/** RefundDialogHost.vue 專用：使用者確認（回傳目前輸入的金額／原因）或取消／關閉（回傳 null）。 */
export function settleRefundPrompt(result: RefundPromptResult | null) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
