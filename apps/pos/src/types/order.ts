import type { CartLineItem } from './drink'

/** 訂單狀態——`editOrderStatus` 只會把它設成這兩者之一。 */
export type OrderStatus = '已完成' | '已取消'

/** 一筆已送出的歷史訂單。 */
export interface OrderRecord {
  orderId: string
  orderTime: string
  orderStatus: OrderStatus
  staff: string
  orderData: CartLineItem[]
  orderBagCount: number
  orderCupCount: number
  orderTotalPrice: number
  orderPayment: string
  orderDiscount: number
  orderPaymentPrice: number
  discountName: string
}
