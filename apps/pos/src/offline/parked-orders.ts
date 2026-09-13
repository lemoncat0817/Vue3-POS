import { offlineDb, type ParkedOrder } from './db'

export async function addParkedOrder(order: ParkedOrder): Promise<void> {
  await offlineDb.parkedOrders.add(order)
}

export async function listParkedOrders(): Promise<ParkedOrder[]> {
  return offlineDb.parkedOrders.orderBy('createdAt').toArray()
}

export async function deleteParkedOrder(id: string): Promise<void> {
  await offlineDb.parkedOrders.delete(id)
}
