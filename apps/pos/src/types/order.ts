import type { InvoiceCarrier } from '@pos/contract'
import type { CartLineItem } from './catalog'

export type OrderStatus = '已完成' | '已取消'

export type OrderChannel = '內用' | '外帶'

export interface OrderRecord {
  orderId: string
  orderTime: string
  orderStatus: OrderStatus
  orderChannel: OrderChannel
  staff: string
  invoiceNumber: string
  invoiceCarrier: InvoiceCarrier
  orderData: CartLineItem[]
  orderBagCount: number
  orderCupCount: number
  orderTotalPrice: number
  orderPayment: string
  orderDiscount: number
  orderPaymentPrice: number
  discountName: string
  refundedAmount: number
  voidReason: string | null
  voidedBy: string | null
  voidedAt: string | null
  memberId?: string | null
  memberName?: string | null
  memberPhone?: string | null
  pointsEarned: number
  pointsRedeemed: number
  tableNumber?: string | null
  note?: string | null
}
