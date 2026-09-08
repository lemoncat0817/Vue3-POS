import { reactive } from 'vue'

/**
 * P19（規劃書 §10 P19「退款／作廢主管二次授權」）：退款、作廢訂單目前
 * 只檢查「目前登入操作員自己有沒有 canEditOrderStatus 這個權限」（見
 * views/order/index.vue 的說明），跟一般操作沒有分別——同一個人只要
 * 一開始登入時有這個權限，之後想退多少款、作廢多少單都不需要再確認
 * 一次。這在真實店面是不夠的：退款／作廢會直接影響班別結算的現金
 * 收入，業界常見做法是即使操作員本身有權限，執行當下還是要再輸入一次
 * 「有權限這麼做的人」的帳號＋PIN 現場核可（可能是操作員自己，也可能
 * 是值班主管），留下「這筆退款／作廢是誰核可的」的紀錄，而不是只看
 * 「誰按了按鈕」。
 *
 * 這裡跟 useRefund.ts／usePrompt.ts 是同一套模式（單一全域實例、
 * promise 風格）：回傳 `{ account, pin } | null`，兩個欄位都非空白
 * 才是物件本身，否則是 null（含取消／ESC／點外面關閉）。真正驗證這組
 * 帳號＋PIN 有沒有效、有沒有對應權限，是呼叫端的責任（見
 * views/order/index.vue 的 requestRefundApproval），這裡只負責收集
 * 輸入，不做驗證——原因跟 login/index.vue 一樣：帳號或 PIN 錯誤要在
 * 呼叫伺服端之後才知道，不能在前端假造判斷。
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
