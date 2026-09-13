import type { CreateOrderRequest } from '@pos/contract'
import { offlineDb, type OutboxOrder } from './db'

export async function enqueueOrder(
  payload: CreateOrderRequest,
  localOrderId: string
): Promise<void> {
  const entry: OutboxOrder = {
    id: payload.idempotencyKey,
    payload,
    localOrderId,
    status: 'pending',
    attempts: 0,
    nextAttemptAt: Date.now(),
    lastError: null,
    createdAt: Date.now()
  }
  await offlineDb.outboxOrders.add(entry)
}

export async function listDueOrders(now: number = Date.now()): Promise<OutboxOrder[]> {
  const pendingOrFailed = await offlineDb.outboxOrders
    .where('status')
    .anyOf(['pending', 'failed'])
    .sortBy('createdAt')
  return pendingOrFailed.filter((order) => order.nextAttemptAt <= now)
}

export async function markSyncing(id: string): Promise<void> {
  await offlineDb.outboxOrders.update(id, { status: 'syncing' })
}

export async function markSynced(id: string): Promise<void> {
  await offlineDb.outboxOrders.delete(id)
}

export async function markFailed(id: string, error: string, nextAttemptAt: number): Promise<void> {
  const row = await offlineDb.outboxOrders.get(id)
  await offlineDb.outboxOrders.update(id, {
    status: 'failed',
    attempts: (row?.attempts ?? 0) + 1,
    lastError: error,
    nextAttemptAt
  })
}

export async function countPending(): Promise<number> {
  return offlineDb.outboxOrders.where('status').anyOf(['pending', 'syncing', 'failed']).count()
}
