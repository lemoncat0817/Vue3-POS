import { reactive } from 'vue'
import type { Order } from '@pos/contract'
import { ApiError } from '@/api/http'
import { createOrder } from '@/api/orders'
import { countPending, listDueOrders, markFailed, markSynced, markSyncing } from './outbox'
import type { OutboxOrder } from './db'

const BASE_DELAY_MS = 2_000
const MAX_DELAY_MS = 60_000

/** 指數退避＋20% 隨機抖動，避免斷線恢復瞬間所有終端機同時重試造成尖峰。 */
export function backoffDelay(attempts: number): number {
  const capped = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempts)
  return capped + Math.random() * capped * 0.2
}

export const syncStatus = reactive({
  pendingCount: 0,
  isSyncing: false,
  lastError: null as string | null,
})

export async function refreshPendingCount(): Promise<void> {
  syncStatus.pendingCount = await countPending()
}

/** 依佇列順序逐筆同步訂單至伺服端；任一筆失敗即中斷當前批次以待重試。 */
export async function syncOnce(
  onSynced: (localOrderId: string, order: Order) => void,
): Promise<void> {
  if (syncStatus.isSyncing) return
  syncStatus.isSyncing = true
  try {
    // 離線狀態直接跳過，避免無效失敗推高退避嘗試次數（finally 仍更新計數）。
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    const due = await listDueOrders()
    for (const entry of due) {
      const ok = await syncOne(entry, onSynced)
      if (!ok) break
    }
  } finally {
    syncStatus.isSyncing = false
    await refreshPendingCount()
  }
}

async function syncOne(entry: OutboxOrder, onSynced: (localOrderId: string, order: Order) => void): Promise<boolean> {
  await markSyncing(entry.id)
  try {
    const order = await createOrder(entry.payload)
    await markSynced(entry.id)
    syncStatus.lastError = null
    onSynced(entry.localOrderId, order)
    return true
  } catch (err) {
    const message = err instanceof ApiError ? err.message : '網路連線失敗'
    await markFailed(entry.id, message, Date.now() + backoffDelay(entry.attempts))
    syncStatus.lastError = message
    return false
  }
}

let intervalId: ReturnType<typeof setInterval> | undefined
let onlineListener: (() => void) | undefined

/** 啟動背景同步：監聽 online 事件並搭配定時輪詢。 */
export function startSyncWorker(onSynced: (localOrderId: string, order: Order) => void): void {
  if (intervalId !== undefined) return
  void refreshPendingCount()
  const tick = () => void syncOnce(onSynced)
  onlineListener = tick
  window.addEventListener('online', onlineListener)
  intervalId = setInterval(tick, 5_000)
  tick()
}

export function stopSyncWorker(): void {
  if (intervalId !== undefined) {
    clearInterval(intervalId)
    intervalId = undefined
  }
  if (onlineListener !== undefined) {
    window.removeEventListener('online', onlineListener)
    onlineListener = undefined
  }
}
