import { describe, expect, it } from 'vitest'
import type { PromotionsResponse } from '@pos/contract'
import { toMoneyDiscounts, toOftenUseDiscountList, toPercentDiscounts } from './promotions'

const samplePromotions: PromotionsResponse = {
  moneyCoupons: [{ id: 'money-1', name: '$50折價券', discountMoney: 50 }],
  percentCoupons: [{ id: 'percent-1', name: '整單95折', discountPercent: 0.95 }],
  oftenUseRates: [
    { slot: 0, name: '環保折扣', discountMoney: 5, discountPercent: 1 },
    { slot: 1, name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
    { slot: 2, name: '九折', discountMoney: 0, discountPercent: 0.9 },
    { slot: 3, name: '八五折', discountMoney: 0, discountPercent: 0.85 },
    { slot: 4, name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
  ],
}

describe('toMoneyDiscounts', () => {
  it('保留 id／name／discountMoney', () => {
    expect(toMoneyDiscounts(samplePromotions)).toEqual([{ id: 'money-1', name: '$50折價券', discountMoney: 50 }])
  })
})

describe('toPercentDiscounts', () => {
  it('discountPercent 轉成前端既有的 discountMoney 欄位（P0 保留的既有命名，見 types/discount.ts）', () => {
    expect(toPercentDiscounts(samplePromotions)).toEqual([{ id: 'percent-1', name: '整單95折', discountMoney: 0.95 }])
  })
})

describe('toOftenUseDiscountList', () => {
  it('slot 轉成前端既有的 id 欄位，保持 5 筆固定順序', () => {
    const list = toOftenUseDiscountList(samplePromotions)
    expect(list).toHaveLength(5)
    expect(list[0]).toEqual({ id: 0, name: '環保折扣', discountMoney: 5, discountPercent: 1 })
    expect(list[4]).toEqual({ id: 4, name: '員工八折', discountMoney: 0, discountPercent: 0.8 })
  })
})
