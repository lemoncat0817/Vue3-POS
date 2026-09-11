import { reactive } from 'vue'

/**
 * 單一文字輸入提示對話框（取代 window.prompt）。
 * 使用者確認且填寫非空白時回傳字串，取消或空白則回傳 null。
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
  resolve: null
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
