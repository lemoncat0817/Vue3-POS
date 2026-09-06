import { describe, expect, it } from 'vitest'
import { GOLDEN_ORDERS } from './golden-orders'

/**
 * 這份測試鎖住 P0 黃金資料集的內容與結構性不變式，作為 P1 導入
 * `priceOrder()` 之後的迴歸比對基準（見重構規劃書 §12、§15）。
 *
 * 三條不變式在這 4 筆重構前的既有訂單上恰好全數成立，用來確認
 * 「資料本身沒有在搬遷過程中被改動」；P1 會再加上以 priceOrder() 重算
 * 同一批品項組成、比對是否得到相同金額的測試。
 */
describe('GOLDEN_ORDERS（P0 黃金資料集）', () => {
  it('固定為重構前的 4 筆歷史訂單', () => {
    expect(GOLDEN_ORDERS).toHaveLength(4)
    expect(GOLDEN_ORDERS.map((order) => order.orderId)).toEqual([
      '202406102',
      '202406105',
      '202406106',
      '202406107',
    ])
  })

  it('內容與搬遷前完全一致（快照鎖定，任何調整都必須是刻意的）', () => {
    expect(GOLDEN_ORDERS).toMatchSnapshot()
  })

  it.each(GOLDEN_ORDERS.map((order) => [order.orderId, order] as const))(
    '訂單 %s：各品項小計加總等於訂單總額',
    (_orderId, order) => {
      const lineTotal = order.orderData.reduce((sum, line) => sum + line.totalPrice, 0)
      expect(lineTotal + order.orderBagCount).toBe(order.orderTotalPrice)
    },
  )

  it.each(GOLDEN_ORDERS.map((order) => [order.orderId, order] as const))(
    '訂單 %s：應付金額等於總額減去折扣',
    (_orderId, order) => {
      expect(order.orderTotalPrice - order.orderDiscount).toBe(order.orderPaymentPrice)
    },
  )

  it.each(GOLDEN_ORDERS.map((order) => [order.orderId, order] as const))(
    '訂單 %s：各品項杯數加總等於訂單總杯數',
    (_orderId, order) => {
      const cupTotal = order.orderData.reduce((sum, line) => sum + line.count, 0)
      expect(cupTotal).toBe(order.orderCupCount)
    },
  )
})
