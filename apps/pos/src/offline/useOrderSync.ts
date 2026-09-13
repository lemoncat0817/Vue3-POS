import type { Order } from '@pos/contract'
import { useOrderStore } from '@/stores/order'
import { startSyncWorker, stopSyncWorker, syncOnce, syncStatus } from './sync-worker'

export function useOrderSync() {
  const orderStore = useOrderStore()
  const onSynced = (localOrderId: string, order: Order) => {
    orderStore.reconcileOrderId(localOrderId, order.orderId, order.invoiceNumber)
  }

  return {
    syncStatus,
    start: () => startSyncWorker(onSynced),
    stop: stopSyncWorker,
    syncNow: () => syncOnce(onSynced)
  }
}
