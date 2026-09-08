import { reactive } from 'vue'

/**
 * P12（規劃書 §10 P0「退款／作廢」）：退款金額＋原因的輸入框，跟
 * usePrompt.ts 的單一文字輸入框不同——這裡多一個「金額」欄位，而且
 * 金額有上限（這筆訂單目前還能退的額度，由呼叫端算好傳進來，見
 * views/order/index.vue 的 refundOrder），所以不能直接複用 prompt()。
 *
 * 回傳 `{ amount, reason } | null`：確認且金額合法（大於 0、不超過
 * `max`）且原因非空白才是物件本身，否則是 null（含取消／ESC／點外面
 * 關閉）——實際送出前伺服端還是會再驗證一次金額上限（見 apps/api/src/
 * routes/orders.ts 的 createRefundRoute），這裡的驗證只是避免使用者
 * 明顯打錯數字就送出，不是唯一的防線。
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
