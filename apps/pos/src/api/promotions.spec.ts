import { describe, expect, it } from 'vitest'
import type { PromotionsResponse } from '@pos/contract'
import { toMoneyDiscounts, toPercentDiscounts, toQuickDiscounts } from './promotions'

const samplePromotions: PromotionsResponse = {
  moneyCoupons: [{ id: 'money-1', name: '$50折價券', discountMoney: 50 }],
  percentCoupons: [{ id: 'percent-1', name: '整單95折', discountPercent: 0.95 }],
  quickDiscounts: [
    { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
    { id: 'quick-2', name: '九折優惠', kind: 'percent', value: 0.9 },
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

describe('toQuickDiscounts', () => {
  it('保留任意筆數的快速折扣清單，不受固定 5 筆限制', () => {
    const list = toQuickDiscounts(samplePromotions)
    expect(list).toHaveLength(2)
    expect(list[0]).toEqual({ id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 })
    expect(list[1]).toEqual({ id: 'quick-2', name: '九折優惠', kind: 'percent', value: 0.9 })
  })
})
