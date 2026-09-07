import Dexie, { type EntityTable } from 'dexie'
import type { CreateOrderRequest } from '@pos/contract'

/**
 * 離線送單佇列（P3：規劃書 §14「建立 Dexie schema 與 outbox」）。
 *
 * 送出訂單這個動作不能因為斷網就失敗——沖泡飲料、收現金這些現場動作
 * 不會因為 Wi-Fi 斷線而停下來。真正需要保證的是「這筆訂單最終會送達
 * 伺服端，且不會因為重試而變成兩筆」，這正是 idempotencyKey（見
 * @pos/contract 的 createOrderRequestSchema）存在的原因：這裡的
 * `id` 直接就是那個 idempotencyKey，佇列裡每一列都對應一次「使用者
 * 按下送出訂單」的意圖，SyncWorker（見 sync-worker.ts）負責把它變成
 * 實際的 POST /api/orders。
 */
export interface OutboxOrder {
  /** 冪等鍵，同時也是這張表的主鍵——伺服端用同一個值判斷是否為重送。 */
  id: string
  payload: CreateOrderRequest
  /** 用來把 SyncWorker 同步成功後，伺服端算出的正式 orderId 回填到本機顯示的那筆訂單。 */
  localOrderId: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  attempts: number
  /** 下次可以重試的時間戳（指數退避，見 sync-worker.ts），在這之前 SyncWorker 略過這一列。 */
  nextAttemptAt: number
  lastError: string | null
  createdAt: number
}

export const offlineDb = new Dexie('pos-offline') as Dexie & {
  outboxOrders: EntityTable<OutboxOrder, 'id'>
}

// createdAt 加索引：SyncWorker 需要依建立順序（等同送單順序）依序處理，
// 避免同一天的訂單序號因為佇列處理順序打亂而錯位。
offlineDb.version(1).stores({
  outboxOrders: 'id, status, createdAt',
})
