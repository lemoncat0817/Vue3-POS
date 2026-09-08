import type { CartLineItem } from './drink'

/** 訂單狀態——`editOrderStatus` 只會把它設成這兩者之一。 */
export type OrderStatus = '已完成' | '已取消'

/** 內用／外帶（P13：規劃書 §10 P0「內用外帶」），見 @pos/contract 的 orderChannelSchema 說明。 */
export type OrderChannel = '內用' | '外帶'

/** 一筆已送出的歷史訂單。 */
export interface OrderRecord {
  orderId: string
  orderTime: string
  orderStatus: OrderStatus
  orderChannel: OrderChannel
  staff: string
  orderData: CartLineItem[]
  orderBagCount: number
  orderCupCount: number
  orderTotalPrice: number
  orderPayment: string
  orderDiscount: number
  orderPaymentPrice: number
  discountName: string
  // P12（規劃書 §10 P0「退款／作廢」）：這幾個欄位是伺服端算出來的
  // 衍生資料（見 @pos/contract 的 orderSchema），送單當下一律是空值／
  // 0／null——訂單列表頁的編輯狀態／退款操作拿到伺服端回應後，會把
  // 這幾個欄位覆寫回真正的值（見 views/order/index.vue 的說明）。
  refundedAmount: number
  voidReason: string | null
  voidedBy: string | null
  voidedAt: string | null
}
