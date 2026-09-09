import { createOrderRequestSchema, orderSchema, type AppliedCoupon, type CreateOrderRequest, type InvoiceCarrier, type Order, type OrderStatus, type RefundInput, type TenderInput } from '@pos/contract'
import { ulid } from '@pos/domain'
import type { CartLineItem, OrderChannel } from '@/types'
import { fetchJson } from './http'

/** 建立訂單。伺服端依 idempotencyKey 判斷冪等重送。 */
export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const body = await fetchJson<unknown>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return orderSchema.parse(body)
}

/** 更新訂單狀態（作廢時需帶入經手人與原因）。需在訂單已同步至伺服端後呼叫。 */
export async function updateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
  operator: string,
  reason?: string,
): Promise<Order> {
  const body = await fetchJson<unknown>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus, operator, reason }),
  })
  return orderSchema.parse(body)
}

export async function deleteOrder(orderId: string): Promise<void> {
  await fetchJson<null>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' })
}

/** 訂單退款：多筆紀錄累加，由伺服端驗證剩餘額度。 */
export async function refundOrder(orderId: string, input: RefundInput): Promise<Order> {
  const body = await fetchJson<unknown>(`/api/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return orderSchema.parse(body)
}

/** 將前端購物車狀態轉換為 CreateOrderRequest（金額由伺服端計算）。 */
export function buildCreateOrderRequest(params: {
  businessDate: string
  staff: string
  lines: CartLineItem[]
  bagCount: number
  tenders: TenderInput[]
  appliedCoupon: AppliedCoupon
  orderChannel: OrderChannel
  invoiceCarrier: InvoiceCarrier
  /** 會員 ID，未選擇則不帶。 */
  memberId?: string | null
  /** 內用桌號，純紀錄用途。 */
  tableNumber?: string | null
}): CreateOrderRequest {
  return createOrderRequestSchema.parse({
    idempotencyKey: ulid(),
    businessDate: params.businessDate,
    staff: params.staff,
    lines: params.lines.map((line) => ({
      name: line.name,
      price: Number(line.price),
      count: line.count,
      addList: line.addList,
      addListPrice: line.addListPrice,
      freeDiscount: line.freeDiscount,
      quickDiscountId: line.quickDiscountId,
    })),
    bagCount: params.bagCount,
    tenders: params.tenders,
    appliedCoupon: params.appliedCoupon,
    orderChannel: params.orderChannel,
    invoiceCarrier: params.invoiceCarrier,
    ...(params.memberId ? { memberId: params.memberId } : {}),
    ...(params.tableNumber ? { tableNumber: params.tableNumber } : {}),
  })
}
