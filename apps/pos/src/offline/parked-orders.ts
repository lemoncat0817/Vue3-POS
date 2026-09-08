import { offlineDb, type ParkedOrder } from './db'

/**
 * 掛單的本機讀寫（P14：規劃書 §10 P0「掛單取單」），見 db.ts 的
 * ParkedOrder 說明。純粹包一層 Dexie 呼叫，讓 ParkedOrdersPanel.vue
 * 不需要直接依賴 Dexie API，跟 offline/outbox.ts 對 outboxOrders 的
 * 包法一致。
 */

export async function addParkedOrder(order: ParkedOrder): Promise<void> {
  await offlineDb.parkedOrders.add(order)
}

/** 依建立時間排序，最早掛的排最前面——跟等待中的客人先來後到一致。 */
export async function listParkedOrders(): Promise<ParkedOrder[]> {
  return offlineDb.parkedOrders.orderBy('createdAt').toArray()
}

export async function deleteParkedOrder(id: string): Promise<void> {
  await offlineDb.parkedOrders.delete(id)
}
