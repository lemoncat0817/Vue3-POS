import type { Order } from '@pos/contract'
import { useOrderStore } from '@/stores/order'
import { startSyncWorker, stopSyncWorker, syncOnce, syncStatus } from './sync-worker'

/**
 * 把 SyncWorker 同步成功的結果接回 orderStore（見 order.ts 的
 * reconcileOrderId 說明）。抽成 composable 是因為需要這個回呼的地方
 * 不只一處：App.vue 用它啟動背景常駐同步，home/index.vue 送單後想立刻
 * 嘗試一次（有網路時不用等下一次輪詢），兩邊要接到同一份回呼邏輯。
 */
export function useOrderSync() {
  const orderStore = useOrderStore()
  const onSynced = (localOrderId: string, order: Order) => {
    orderStore.reconcileOrderId(localOrderId, order.orderId)
  }

  return {
    syncStatus,
    start: () => startSyncWorker(onSynced),
    stop: stopSyncWorker,
    syncNow: () => syncOnce(onSynced),
  }
}
