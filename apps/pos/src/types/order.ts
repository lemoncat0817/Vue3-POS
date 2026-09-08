import type { InvoiceCarrier } from '@pos/contract'
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
  // P15（規劃書 §10 P0「發票」）：invoiceNumber 送單當下一律是空字串，
  // 由伺服端配發後才有真正的值（見 api/orders.ts、views/home/index.vue
  // 的 submitPayment 說明）——跟 refundedAmount 這幾個衍生欄位同一種
  // 「先佔位、拿到伺服端回應才覆寫」的處理方式。
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
  // P12（規劃書 §10 P0「退款／作廢」）：這幾個欄位是伺服端算出來的
  // 衍生資料（見 @pos/contract 的 orderSchema），送單當下一律是空值／
  // 0／null——訂單列表頁的編輯狀態／退款操作拿到伺服端回應後，會把
  // 這幾個欄位覆寫回真正的值（見 views/order/index.vue 的說明）。
  refundedAmount: number
  voidReason: string | null
  voidedBy: string | null
  voidedAt: string | null
  /**
   * 這筆訂單掛在哪個會員名下（P22：規劃書 §10 P22「會員與顧客經營」）
   * ——選填，因為 GOLDEN_ORDERS 這份離線種子資料（見 stores/order.ts）
   * 沒有這個概念，逐一補上沒有意義；伺服端回應一律會帶這個欄位（見
   * @pos/contract 的 orderSchema）。
   */
  memberId?: string | null
}
