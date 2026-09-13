import {
  createOrderRequestSchema,
  orderListResponseSchema,
  orderSchema,
  orderSummarySchema,
  type AppliedCoupon,
  type CreateOrderRequest,
  type InvoiceCarrier,
  type ListOrdersQuery,
  type Order,
  type OrderListResponse,
  type OrderStatus,
  type OrderSummary,
  type RefundInput,
  type TenderInput
} from '@pos/contract'
import { ulid } from '@pos/domain'
import type { CartLineItem, OrderChannel, OrderRecord } from '@/types'
import { fetchJson } from './http'

/** 建立訂單。伺服端依 idempotencyKey 判斷冪等重送。 */
export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const body = await fetchJson<unknown>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return orderSchema.parse(body)
}

/**
 * 更新訂單狀態（作廢時需帶入經手人與原因）。需在訂單已同步至伺服端後呼叫。
 * 作廢（orderStatus === '已取消'）需要 canRefundOrVoid，伺服端會核對這點
 * ——目前登入的操作員未必有這個權限，是透過主管二次授權核可，所以要帶
 * `approverSessionToken`（核可主管登入核發的 session，不是目前登入中的
 * 操作員）蓋掉預設的 X-Operator-Session，見 views/order/index.vue 的
 * requestRefundOrVoidApproval。
 */
export async function updateOrderStatus(
  orderId: string,
  orderStatus: OrderStatus,
  operator: string,
  reason?: string,
  approverSessionToken?: string
): Promise<Order> {
  const body = await fetchJson<unknown>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus, operator, reason }),
    ...(approverSessionToken ? { headers: { 'X-Operator-Session': approverSessionToken } } : {})
  })
  return orderSchema.parse(body)
}

export async function deleteOrder(orderId: string): Promise<void> {
  await fetchJson<null>(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' })
}

/**
 * 訂單列表頁：後端分頁＋進階篩選，見 @pos/contract 的 listOrdersQuerySchema。
 * 篩選欄位留空（undefined／空字串）就不送進 query string，由後端視為不限
 * ——跟原本前端篩選「空字串代表不限」的語意保持一致。
 */
export async function listOrders(query: Partial<ListOrdersQuery>): Promise<OrderListResponse> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const queryString = params.toString()
  const body = await fetchJson<unknown>(`/api/orders${queryString ? `?${queryString}` : ''}`)
  return orderListResponseSchema.parse(body)
}

/** 訂單列表頁的 KPI 摘要與服務人員名單，跟分頁清單分開抓（見 @pos/contract 的 orderSummarySchema 說明）。 */
export async function getOrderSummary(): Promise<OrderSummary> {
  const body = await fetchJson<unknown>('/api/orders/summary')
  return orderSummarySchema.parse(body)
}

/**
 * 把伺服端的 Order 轉成畫面用的 OrderRecord。兩者欄位幾乎一致，只有
 * orderData 的品項形狀不同（CartLineItem 多一個本機用的 id，畫面渲染
 * 不依賴它的值，用陣列索引補上即可）。
 */
export function orderToRecord(order: Order): OrderRecord {
  return {
    orderId: order.orderId,
    orderTime: order.orderTime,
    orderStatus: order.orderStatus,
    orderChannel: order.orderChannel,
    staff: order.staff,
    invoiceNumber: order.invoiceNumber,
    invoiceCarrier: order.invoiceCarrier,
    orderData: order.orderData.map((line, index) => ({ id: index, ...line })),
    orderBagCount: order.orderBagCount,
    orderCupCount: order.orderCupCount,
    orderTotalPrice: order.orderTotalPrice,
    orderPayment: order.orderPayment,
    orderDiscount: order.orderDiscount,
    orderPaymentPrice: order.orderPaymentPrice,
    discountName: order.discountName,
    refundedAmount: order.refundedAmount,
    voidReason: order.voidReason,
    voidedBy: order.voidedBy,
    voidedAt: order.voidedAt,
    memberId: order.memberId,
    pointsEarned: order.pointsEarned,
    pointsRedeemed: order.pointsRedeemed,
    tableNumber: order.tableNumber,
    note: order.note
  }
}

/** 訂單退款：多筆紀錄累加，由伺服端驗證剩餘額度。需要 canRefundOrVoid，見 updateOrderStatus 的 approverSessionToken 說明。 */
export async function refundOrder(
  orderId: string,
  input: RefundInput,
  approverSessionToken: string
): Promise<Order> {
  const body = await fetchJson<unknown>(`/api/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'X-Operator-Session': approverSessionToken }
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
  /** 這筆訂單要用多少點數折抵，沒有掛會員或不折抵就不帶。 */
  pointsToRedeem?: number
  /** 內用桌號，純紀錄用途。 */
  tableNumber?: string | null
  /** 訂單備註，純紀錄用途。 */
  note?: string | null
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
      quickDiscountId: line.quickDiscountId
    })),
    bagCount: params.bagCount,
    tenders: params.tenders,
    appliedCoupon: params.appliedCoupon,
    orderChannel: params.orderChannel,
    invoiceCarrier: params.invoiceCarrier,
    ...(params.memberId ? { memberId: params.memberId } : {}),
    ...(params.memberId && params.pointsToRedeem ? { pointsToRedeem: params.pointsToRedeem } : {}),
    ...(params.tableNumber ? { tableNumber: params.tableNumber } : {}),
    ...(params.note ? { note: params.note } : {})
  })
}
