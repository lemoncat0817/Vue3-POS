import { createOrderRequestSchema, orderSchema, type AppliedCoupon, type CreateOrderRequest, type Order, type OrderStatus, type TenderInput } from '@pos/contract'
import { ulid } from '@pos/domain'
import type { CartLineItem } from '@/types'
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

/**
 * 對應 PATCH /api/orders/:orderId/status、DELETE /api/orders/:orderId
 * （P6：規劃書 §3「多終端情境」）。views/order/index.vue 的編輯訂單狀態／
 * 刪除訂單原本只改本機 Pinia 狀態，從來沒有打過任何 API——單店單機
 * 情境下看不太出問題，但只要有第二台終端，本機的異動就會被伺服端
 * 尚未更新的資料蓋掉。這兩個函式改成真的呼叫伺服端。
 *
 * 這兩個操作都要求訂單已經同步到伺服端（先前用 idempotencyKey 送過
 * POST /api/orders 且伺服端配發過正式 orderId）——如果這筆訂單還在
 * 離線佇列裡等待同步（見 src/offline/），伺服端會回 404，呼叫端要自己
 * 處理這個情況（見 views/order/index.vue 的錯誤訊息），這裡不額外做
 * 「排入佇列稍後重試」，避免跟送單本身的離線佇列機制混在一起。
 */
export async function updateOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<Order> {
  const body = await fetchJson<unknown>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus }),
  })
  return orderSchema.parse(body)
}

export async function deleteOrder(orderId: string): Promise<void> {
  await fetchJson<null>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' })
}

/**
 * 把 home/index.vue 送單當下的購物車狀態轉成 CreateOrderRequest。
 *
 * 用戶端只送出「選了什麼」（品項基本資料＋折扣旗標、套用了哪張訂單
 * 層級折價券），不送算好的金額——伺服端會用 @pos/domain 的
 * priceLine() 重新計算品項金額，訂單層級折價券的折抵金額也改由伺服端
 * 查真正的折價券資料重算（見 createOrderRequestSchema 的說明，這是
 * D-01／D-02 修復方式的延伸，P5 促銷引擎把它套用到訂單層級折價券）。
 * 這裡刻意用 Number(...) 轉換 price／addListPrice：CartLineItem 的
 * 欄位是 FormNumeric（number | string，見 D-19 的說明），送出前正規化
 * 成 number，跟 P1 處理同一個型別落差時採用的方式一致。
 *
 * idempotencyKey 用 ulid() 在用戶端當下產生——訂單要能離線先入列（見
 * src/offline/），必須在完全連不上伺服端的情況下就決定好這個鍵。
 */
export function buildCreateOrderRequest(params: {
  businessDate: string
  staff: string
  lines: CartLineItem[]
  bagCount: number
  tenders: TenderInput[]
  appliedCoupon: AppliedCoupon
}): CreateOrderRequest {
  return createOrderRequestSchema.parse({
    idempotencyKey: ulid(),
    businessDate: params.businessDate,
    staff: params.staff,
    lines: params.lines.map((line) => ({
      name: line.name,
      price: Number(line.price),
      size: line.size,
      count: line.count,
      addList: line.addList,
      addListPrice: line.addListPrice,
      freeDiscount: line.freeDiscount,
      ecoDiscount: line.ecoDiscount,
      bottleDiscount: line.bottleDiscount,
      oftenUseDiscount1: line.oftenUseDiscount1,
      oftenUseDiscount2: line.oftenUseDiscount2,
      oftenUseDiscount3: line.oftenUseDiscount3,
    })),
    bagCount: params.bagCount,
    tenders: params.tenders,
    appliedCoupon: params.appliedCoupon,
  })
}
