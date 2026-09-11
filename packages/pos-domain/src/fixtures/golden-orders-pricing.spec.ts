import { describe, expect, it } from 'vitest'
import { priceLine, type LineDiscountFlags } from '../pricing'
import { GOLDEN_ORDERS } from './golden-orders'
import { DEFAULT_QUICK_DISCOUNTS } from './quick-discounts'

/** 用黃金資料集的品項組成重跑 priceLine()，驗證重算結果與歷史訂單金額一致。 */
describe('priceLine() 對照黃金資料集', () => {
  const cases = GOLDEN_ORDERS.flatMap((order) =>
    order.orderData.map((line) => ({
      orderId: order.orderId,
      lineName: line.name,
      line
    }))
  )

  it.each(cases.map(({ orderId, lineName, line }) => [`${orderId} - ${lineName}`, line] as const))(
    '%s：priceLine() 重算結果與既有金額一致',
    (_label, line) => {
      const flags: LineDiscountFlags = {
        freeDiscount: line.freeDiscount,
        quickDiscountId: line.quickDiscountId
      }
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        flags,
        DEFAULT_QUICK_DISCOUNTS
      )

      expect(priced.totalPrice).toBe(line.totalPrice)
      expect(priced.discount).toBe(line.discount)
      expect(priced.quickDiscountName).toBe(line.quickDiscountName)
    }
  )

  it('訂單層級：各行小計加總後仍等於既有的 orderTotalPrice（加上袋子數量）', () => {
    for (const order of GOLDEN_ORDERS) {
      const recomputedLines = order.orderData.map((line) =>
        priceLine(
          { price: line.price, count: line.count, addListPrice: line.addListPrice },
          { freeDiscount: line.freeDiscount, quickDiscountId: line.quickDiscountId },
          DEFAULT_QUICK_DISCOUNTS
        )
      )
      const recomputedTotal =
        recomputedLines.reduce((sum, l) => sum + l.totalPrice, 0) + order.orderBagCount
      expect(recomputedTotal).toBe(order.orderTotalPrice)
    }
  })
})
