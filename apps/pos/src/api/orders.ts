import { orderSchema, type CreateOrderRequest, type Order } from '@pos/contract'
import { fetchJson } from './http'

/**
 * 對應 POST /api/orders。伺服端用 idempotencyKey 判斷重送（見 apps/api/
 * src/routes/orders.ts），這裡不用額外處理「已經送過」的情況——同一個
 * payload 重送會拿回同一筆訂單（200），不會是新訂單（201），呼叫端只要
 * 認得回應是同一筆訂單即可，不需要區分狀態碼。
 */
export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const body = await fetchJson<unknown>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return orderSchema.parse(body)
}
