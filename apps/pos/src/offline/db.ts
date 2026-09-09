import Dexie, { type EntityTable } from 'dexie'
import type { CreateOrderRequest } from '@pos/contract'
import type { InvoiceCarrier } from '@pos/contract'
import type { CartLineItem, FormNumeric, OrderChannel } from '@/types'

/** 離線送單佇列：保證斷網時的送單最終送達伺服端，依 idempotencyKey 保證冪等。 */
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

/** 本機掛單暫存：僅存在終端本機，儲存還原購物車所需的最小狀態。 */
export interface ParkedOrder {
  /** ULID，同時是這張表的主鍵。 */
  id: string
  createdAt: number
  /** 選填備註，方便店員辨認「這是哪一桌／哪位客人」，例如「3號桌」。 */
  note: string
  lines: CartLineItem[]
  bagCount: number
  orderChannel: OrderChannel
  /** 發票載具設定。 */
  invoiceCarrier: InvoiceCarrier
  orderCouponId: FormNumeric
  currentDiscountName: string
}

export const offlineDb = new Dexie('pos-offline') as Dexie & {
  outboxOrders: EntityTable<OutboxOrder, 'id'>
  parkedOrders: EntityTable<ParkedOrder, 'id'>
}

// createdAt 加索引以依送單順序處理。
offlineDb.version(1).stores({
  outboxOrders: 'id, status, createdAt',
})

// 新增 parkedOrders 表，保留既有 outboxOrders 定義。
offlineDb.version(2).stores({
  outboxOrders: 'id, status, createdAt',
  parkedOrders: 'id, createdAt',
})
