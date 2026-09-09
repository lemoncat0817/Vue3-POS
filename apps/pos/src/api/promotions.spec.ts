import { describe, expect, it } from 'vitest'
import type { PromotionsResponse } from '@pos/contract'
import { toOrderCoupons, toQuickDiscounts } from './promotions'

const samplePromotions: PromotionsResponse = {
  orderCoupons: [
    { id: 'money-1', name: '$50折價券', kind: 'amount', value: 50 },
    { id: 'percent-1', name: '整單95折', kind: 'percent', value: 0.95 },
  ],
  quickDiscounts: [
    { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
    { id: 'quick-2', name: '九折優惠', kind: 'percent', value: 0.9 },
  ],
}

describe('toOrderCoupons', () => {
  it('保留 id／name／kind／value', () => {
    expect(toOrderCoupons(samplePromotions)).toEqual([
      { id: 'money-1', name: '$50折價券', kind: 'amount', value: 50 },
      { id: 'percent-1', name: '整單95折', kind: 'percent', value: 0.95 },
    ])
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
