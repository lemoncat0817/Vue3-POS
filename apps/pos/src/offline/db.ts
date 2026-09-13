import Dexie, { type EntityTable } from 'dexie'
import type { CreateOrderRequest } from '@pos/contract'
import type { InvoiceCarrier } from '@pos/contract'
import type { CartLineItem, FormNumeric, OrderChannel } from '@/types'

export interface OutboxOrder {
  id: string // 冪等鍵與表主鍵
  payload: CreateOrderRequest
  localOrderId: string // 同步成功後用於回填正式 orderId
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  attempts: number
  nextAttemptAt: number // 下次重試時間戳
  lastError: string | null
  createdAt: number
}

export interface ParkedOrder {
  id: string
  createdAt: number
  note: string
  lines: CartLineItem[]
  bagCount: number
  orderChannel: OrderChannel
  invoiceCarrier: InvoiceCarrier
  orderCouponId: FormNumeric
  currentDiscountName: string
  // 訂單內容備註，送至伺服端並印於收據，與掛單識別備註區隔。
  orderNote?: string
}

export const offlineDb = new Dexie('pos-offline') as Dexie & {
  outboxOrders: EntityTable<OutboxOrder, 'id'>
  parkedOrders: EntityTable<ParkedOrder, 'id'>
}

// createdAt 加索引以依送單順序處理。
offlineDb.version(1).stores({
  outboxOrders: 'id, status, createdAt'
})

offlineDb.version(2).stores({
  outboxOrders: 'id, status, createdAt',
  parkedOrders: 'id, createdAt'
})
