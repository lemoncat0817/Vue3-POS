import { reactive } from 'vue'

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
  resolve: null
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

export function settleManagerAuth(result: ManagerAuthResult | null) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
