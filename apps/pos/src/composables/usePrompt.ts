import { reactive } from 'vue'

/**
 * P12（規劃書 §10 P0「退款／作廢」）：單一文字輸入的提示框，取代
 * `window.prompt()`——跟 useConfirm.ts 的 confirm() 是同一組模式（單一
 * 全域實例、promise 風格），差別是這裡除了確認／取消，還需要使用者
 * 打一段文字（目前只有「作廢原因」這個用途，見 views/order/index.vue
 * 的 editOrderStatus）。
 *
 * 回傳 `string | null`：使用者按確認且欄位非空白時是字串本身（已
 * trim），按取消／ESC／點外面關閉都是 null——呼叫端不用分辨「取消」
 * 跟「沒填」，反正兩種都代表「不繼續」。
 */
export interface PromptOptions {
  title: string
  description?: string
  label: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

interface PromptState extends Required<Omit<PromptOptions, 'description' | 'placeholder'>> {
  open: boolean
  description: string | undefined
  placeholder: string | undefined
  value: string
  resolve: ((result: string | null) => void) | null
}

const state = reactive<PromptState>({
  open: false,
  title: '',
  description: undefined,
  label: '',
  placeholder: undefined,
  confirmText: '確定',
  cancelText: '取消',
  value: '',
  resolve: null,
})

export function usePromptState() {
  return state
}

export function prompt(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    state.resolve?.(null)
    state.title = options.title
    state.description = options.description
    state.label = options.label
    state.placeholder = options.placeholder
    state.confirmText = options.confirmText ?? '確定'
    state.cancelText = options.cancelText ?? '取消'
    state.value = ''
    state.resolve = resolve
    state.open = true
  })
}

/** PromptDialogHost.vue 專用：使用者確認（回傳目前輸入的文字）或取消／關閉（回傳 null）。 */
export function settlePrompt(result: string | null) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
