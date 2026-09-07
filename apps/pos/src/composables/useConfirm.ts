import { reactive } from 'vue'

/**
 * P8：取代 `ElMessageBox.confirm(...).then().catch()` 的確認對話框。
 *
 * 呼叫端維持跟 ElMessageBox.confirm 幾乎一樣的 promise 風格（見
 * views/order/index.vue 的 editOrderStatus／deleteOrder），底層改用
 * Reka UI 的 AlertDialog 原語（見 components/ui/ConfirmDialogHost.vue）
 * 渲染，畫面樣式改用這個專案自己的 Tailwind token（見 tailwind.config.js）。
 *
 * 回傳值刻意是三態（'confirm' | 'cancel' | 'dismiss'），不是原本
 * ElMessageBox 那種「resolve／reject」二選一：原本 editOrderStatus 把
 * 一個「確定／取消」的確認框硬拗成三選一（確定＝已完成、取消按鈕＝
 * 已取消、ESC／點外面關閉＝不變更），呼叫端要另外用 `reason !== 'cancel'`
 * 才能分辨「按了取消」跟「直接關掉」——這裡把這個區分正式收進回傳型別，
 * 呼叫端不用再猜 reject 的原因字串。
 */
export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** 'danger' 用在刪除等不可逆操作，按鈕改用警示色；預設 'info'。 */
  variant?: 'danger' | 'info'
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
  resolve: null,
})

/** 給 ConfirmDialogHost.vue 讀取目前要顯示的內容，不對外匯出。 */
export function useConfirmState() {
  return state
}

/** 彈出確認框，回傳使用者的選擇。同時間只會有一個確認框——跟
 * ElMessageBox 一樣，後一次呼叫會直接覆蓋還沒關閉的前一個。 */
export function confirm(options: ConfirmOptions): Promise<ConfirmResult> {
  return new Promise((resolve) => {
    state.resolve?.('dismiss')
    state.title = options.title
    state.description = options.description
    state.confirmText = options.confirmText ?? '確定'
    state.cancelText = options.cancelText ?? '取消'
    state.variant = options.variant ?? 'info'
    state.resolve = resolve
    state.open = true
  })
}

/** ConfirmDialogHost.vue 專用：使用者做出選擇（或關閉對話框）時呼叫。 */
export function settleConfirm(result: ConfirmResult) {
  state.open = false
  state.resolve?.(result)
  state.resolve = null
}
