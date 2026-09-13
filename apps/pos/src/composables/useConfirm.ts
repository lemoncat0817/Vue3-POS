import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info'
  singleButton?: boolean
}

export type ConfirmResult = 'confirm' | 'cancel' | 'dismiss'

interface ConfirmState extends Required<Omit<ConfirmOptions, 'description'>> {
  open: boolean
  description: string | undefined
  resolve: ((result: ConfirmResult) => void) | null
}

const state = reactive<ConfirmState>({
  open: false,
  title: '',
  description: undefined,
  confirmText: '確定',
  cancelText: '取消',
  variant: 'info',
  singleButton: false,
  resolve: null
})

export function useConfirmState() {
  return state
}

export function confirm(options: ConfirmOptions): Promise<ConfirmResult> {
  return new Promise((resolve) => {
    state.resolve?.('dismiss')
    state.title = options.title
    state.description = options.description
    state.confirmText = options.confirmText ?? '確定'
    state.cancelText = options.cancelText ?? '取消'
    state.variant = options.variant ?? 'info'
    state.singleButton = options.singleButton ?? false
    state.resolve = resolve
    state.open = true
  })
}

export function alert(options: Omit<ConfirmOptions, 'cancelText' | 'variant'>): Promise<void> {
  return confirm({ ...options, singleButton: true }).then(() => undefined)
}

export function settleConfirm(result: ConfirmResult) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
