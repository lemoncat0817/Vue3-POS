import Dexie, { type EntityTable } from 'dexie'
import type { CreateOrderRequest } from '@pos/contract'
import type { InvoiceCarrier } from '@pos/contract'
import type { CartLineItem, FormNumeric, OrderChannel } from '@/types'

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

/**
 * 掛單（P14：規劃書 §10 P0「掛單取單」）。
 *
 * 「掛單」讓店員把目前正在點的購物車暫存起來、先服務下一位客人，稍後
 * 再「取單」繼續——跟送出訂單（outboxOrders）是完全不同的東西：掛單
 * 從來沒有變成一筆真正的訂單，不會出現在訂單列表，也不需要伺服端
 * 知道它存在。這裡只存回復購物車所需要的最小狀態：品項清單、袋子
 * 數量、套用中的折價券（見 stores/discount.ts 對應欄位的說明）、
 * 內用外帶、發票載具——後兩者不是 Pinia store 的狀態（見
 * views/home/index.vue 的 orderChannel／invoiceCarrier 說明），由
 * 呼叫端（ParkedOrdersPanel.vue）自己傳入目前選擇、取單時再讀回去。
 *
 * 只存在單一終端機的本機（跟 outboxOrders 一樣），不會同步到伺服端或
 * 其他終端——單店單機情境下這是務實的取捨，理由跟 shifts 不做多終端
 * 隔離一致（見 apps/api/src/db/schema.ts 的 shifts 說明）。
 */
export interface ParkedOrder {
  /** ULID，同時是這張表的主鍵。 */
  id: string
  createdAt: number
  /** 選填備註，方便店員辨認「這是哪一桌／哪位客人」，例如「3號桌」。 */
  note: string
  lines: CartLineItem[]
  bagCount: number
  orderChannel: OrderChannel
  /** 發票載具（P15：規劃書 §10 P0「發票」），見 InvoiceCarrierPanel.vue 的說明。 */
  invoiceCarrier: InvoiceCarrier
  moneyDiscountId: FormNumeric
  percentDiscountId: FormNumeric
  currentMoneyDiscount: FormNumeric
  currentPercentDiscount: FormNumeric
  currentDiscountName: string
}

export const offlineDb = new Dexie('pos-offline') as Dexie & {
  outboxOrders: EntityTable<OutboxOrder, 'id'>
  parkedOrders: EntityTable<ParkedOrder, 'id'>
}

// createdAt 加索引：SyncWorker 需要依建立順序（等同送單順序）依序處理，
// 避免同一天的訂單序號因為佇列處理順序打亂而錯位。
offlineDb.version(1).stores({
  outboxOrders: 'id, status, createdAt',
})

// P14：新增 parkedOrders 表——沿用同一個 Dexie 資料庫，不另外開一個，
// 理由跟兩者都是「這台終端機的本機暫存資料」一致，沒有必要拆成兩個
// 資料庫。version(2) 依 Dexie 慣例要重複宣告未變動的既有表（見
// Dexie 文件的 schema 版本演進說明），不是又重新定義一次 outboxOrders。
offlineDb.version(2).stores({
  outboxOrders: 'id, status, createdAt',
  parkedOrders: 'id, createdAt',
})
