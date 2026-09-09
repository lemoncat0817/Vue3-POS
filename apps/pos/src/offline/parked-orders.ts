import { offlineDb, type ParkedOrder } from './db'

/** 本機掛單讀寫封裝。 */
export async function addParkedOrder(order: ParkedOrder): Promise<void> {
  await offlineDb.parkedOrders.add(order)
}

/** 依建立時間排序取得所有掛單。 */
export async function listParkedOrders(): Promise<ParkedOrder[]> {
  return offlineDb.parkedOrders.orderBy('createdAt').toArray()
}

export async function deleteParkedOrder(id: string): Promise<void> {
  await offlineDb.parkedOrders.delete(id)
}
