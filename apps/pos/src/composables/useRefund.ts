import { reactive } from 'vue'

export interface RefundPromptOptions {
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
  resolve: null
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

export function settleRefundPrompt(result: RefundPromptResult | null) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
