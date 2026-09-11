import { reactive } from 'vue'

/**
 * 確認對話框 composable。
 * 回傳值為三態（'confirm' | 'cancel' | 'dismiss'），清楚區分確認、取消與點擊遮罩/ESC 關閉。
 */
export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** 'danger' 用在刪除等不可逆操作，按鈕改用警示色；預設 'info'。 */
  variant?: 'danger' | 'info'
  /** 只顯示確認鍵，不顯示取消鍵——見 alert() 的說明。 */
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

/** 給 ConfirmDialogHost.vue 讀取目前要顯示的內容，不對外匯出。 */
export function useConfirmState() {
  return state
}

/** 彈出確認框，回傳使用者的選擇。後一次呼叫會覆蓋未關閉的前一個。 */
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

/** 單鍵純告知對話框，使用者確認或關閉後 resolve。 */
export function alert(options: Omit<ConfirmOptions, 'cancelText' | 'variant'>): Promise<void> {
  return confirm({ ...options, singleButton: true }).then(() => undefined)
}

/** ConfirmDialogHost.vue 專用：使用者做出選擇（或關閉對話框）時呼叫。 */
export function settleConfirm(result: ConfirmResult) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
