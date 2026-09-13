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

export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const body = await fetchJson<unknown>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return orderSchema.parse(body)
}

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

export async function listOrders(query: Partial<ListOrdersQuery>): Promise<OrderListResponse> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const queryString = params.toString()
  const body = await fetchJson<unknown>(`/api/orders${queryString ? `?${queryString}` : ''}`)
  return orderListResponseSchema.parse(body)
}

export async function getOrderSummary(): Promise<OrderSummary> {
  const body = await fetchJson<unknown>('/api/orders/summary')
  return orderSummarySchema.parse(body)
}

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
    memberName: order.memberName,
    memberPhone: order.memberPhone,
    pointsEarned: order.pointsEarned,
    pointsRedeemed: order.pointsRedeemed,
    tableNumber: order.tableNumber,
    note: order.note
  }
}

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

export function buildCreateOrderRequest(params: {
  businessDate: string
  staff: string
  lines: CartLineItem[]
  bagCount: number
  tenders: TenderInput[]
  appliedCoupon: AppliedCoupon
  orderChannel: OrderChannel
  invoiceCarrier: InvoiceCarrier
  memberId?: string | null
  pointsToRedeem?: number
  tableNumber?: string | null
  guestCount?: number | null
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
    ...(params.guestCount ? { guestCount: params.guestCount } : {}),
    ...(params.note ? { note: params.note } : {})
  })
}
