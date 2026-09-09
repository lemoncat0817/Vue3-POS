import type { InvoiceCarrier } from '@pos/contract'
import type { CartLineItem } from './catalog'

/** 訂單狀態——`editOrderStatus` 只會把它設成這兩者之一。 */
export type OrderStatus = '已完成' | '已取消'

/** 內用／外帶。 */
export type OrderChannel = '內用' | '外帶'

/** 一筆已送出的歷史訂單。 */
export interface OrderRecord {
  orderId: string
  orderTime: string
  orderStatus: OrderStatus
  orderChannel: OrderChannel
  staff: string
  /** 發票號碼：送單時先佔位，由伺服端配發後更新。 */
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
  /** 退款與作廢衍生資料：由伺服端計算並於操作後更新。 */
  refundedAmount: number
  voidReason: string | null
  voidedBy: string | null
  voidedAt: string | null
  /** 會員 ID，選填。 */
  memberId?: string | null
  /** 內用桌號，選填。 */
  tableNumber?: string | null
}
