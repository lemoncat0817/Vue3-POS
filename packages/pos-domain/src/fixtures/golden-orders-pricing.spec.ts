import { describe, expect, it } from 'vitest'
import { priceLine, type LineDiscountFlags } from '../pricing'
import { GOLDEN_ORDERS } from './golden-orders'
import { DEFAULT_OFTEN_USE_RATES } from './often-use-rates'

/**
 * P1 退出條件（重構規劃書 §14）：用黃金資料集的品項組成重新跑一次
 * priceLine()，比對重算結果是否與既有金額一致——證明「D-01／D-02 的
 * 修復沒有把原本就正確的計算結果改壞」。
 *
 * 這 4 筆歷史訂單裡的折扣都是單一類型（環保、瓶裝、九折），沒有踩到
 * D-01／D-02 實際會出錯的「疊加後取消」情境，所以重算結果理應逐筆
 * 一致；這正是這份測試要驗證的事。
 */
describe('priceLine() 對照黃金資料集（P1 退出條件）', () => {
  const cases = GOLDEN_ORDERS.flatMap((order) =>
    order.orderData.map((line) => ({
      orderId: order.orderId,
      lineName: line.name,
      line,
    })),
  )

  it.each(cases.map(({ orderId, lineName, line }) => [`${orderId} - ${lineName}`, line] as const))(
    '%s：priceLine() 重算結果與既有金額一致',
    (_label, line) => {
      const flags: LineDiscountFlags = {
        freeDiscount: line.freeDiscount,
        ecoDiscount: line.ecoDiscount,
        bottleDiscount: line.bottleDiscount,
        oftenUseDiscount1: line.oftenUseDiscount1,
        oftenUseDiscount2: line.oftenUseDiscount2,
        oftenUseDiscount3: line.oftenUseDiscount3,
      }
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        flags,
        DEFAULT_OFTEN_USE_RATES,
      )

      expect(priced.totalPrice).toBe(line.totalPrice)
      expect(priced.discount).toBe(line.discount)
      expect(priced.currentDiscountMoney).toBe(line.currentDiscountMoney)
      expect(priced.currentDiscountPercent).toBe(line.currentDiscountPercent)
      expect(priced.useDiscountMoney).toBe(line.useDiscountMoney)
      expect(priced.useDiscountPercent).toBe(line.useDiscountPercent)
      expect(priced.useDiscountFree).toBe(line.useDiscountFree)
    },
  )

  it('訂單層級：各行小計加總後仍等於既有的 orderTotalPrice（加上袋子數量）', () => {
    for (const order of GOLDEN_ORDERS) {
      const recomputedLines = order.orderData.map((line) =>
        priceLine(
          { price: line.price, count: line.count, addListPrice: line.addListPrice },
          {
            freeDiscount: line.freeDiscount,
            ecoDiscount: line.ecoDiscount,
            bottleDiscount: line.bottleDiscount,
            oftenUseDiscount1: line.oftenUseDiscount1,
            oftenUseDiscount2: line.oftenUseDiscount2,
            oftenUseDiscount3: line.oftenUseDiscount3,
          },
          DEFAULT_OFTEN_USE_RATES,
        ),
      )
      const recomputedTotal = recomputedLines.reduce((sum, l) => sum + l.totalPrice, 0) + order.orderBagCount
      expect(recomputedTotal).toBe(order.orderTotalPrice)
    }
  })
})
