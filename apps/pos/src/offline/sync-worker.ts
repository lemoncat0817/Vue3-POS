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

/**
 * 離線送單同步（P3：規劃書 §14 的 SyncWorker）。
 *
 * 依建立順序（listDueOrders 已排序）逐筆處理，故意不平行送出：伺服端
 * 的訂單序號是「同一營業日內的訂單數 + 1」（見 apps/api/src/routes/
 * orders.ts），平行送出會讓序號跟實際送單先後脫鉤，逐筆處理則至少在
 * 單一裝置離線佇列內部維持順序。遇到失敗就停止這一輪（不跳過繼續處理
 * 佇列後面的項目）：同一個原因（通常是連不上伺服端）會讓後面的項目
 * 一樣失敗，沒有必要在同一輪內把每一筆都重試一次。
 */
export async function syncOnce(
  onSynced: (localOrderId: string, order: Order) => void,
): Promise<void> {
  if (syncStatus.isSyncing) return
  syncStatus.isSyncing = true
  try {
    // 瀏覽器已經知道自己離線時，直接跳過——不要明知道會失敗還硬打一次。
    // 這不只是省一次無謂的請求：home/index.vue 每次送單都會呼叫一次
    // syncNow()，離線時連續送好幾張單會讓佇列最舊的那筆在短時間內被
    // 「嘗試又失敗」好幾輪，指數退避的 attempts 因此漲得比真實使用情境
    // 快很多，反而讓它要等更久才輪到下一次真正有機會成功的重試（連線
    // 恢復後）。跳過離線時的嘗試，attempts 只在「真的打過但失敗」時才
    // 增加，退避時間才會反映真實的失敗次數。放在 try 區塊內（而不是
    // 函式最開頭就 return）是為了讓 finally 照樣執行
    // refreshPendingCount()——離線時新入列的項目一樣要反映在
    // pendingCount 上，不能因為跳過了嘗試就沒更新這個數字。
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

/**
 * 啟動背景同步：連線恢復（'online' 事件）立刻嘗試一次，另外用定時輪詢
 * 兜底——'online' 事件只在瀏覽器認定的連線狀態改變時觸發一次，伺服端
 * 本身暫時性錯誤（例如 Workers 冷啟動逾時）不會觸發它，需要定時輪詢
 * 才能在指數退避的等待時間過了之後真正重試。
 */
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
