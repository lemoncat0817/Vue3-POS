import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDiscountStore } from './discount'

describe('useDiscountStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始狀態包含預設折價券與快速折扣選項', () => {
    const store = useDiscountStore()
    expect(store.orderCoupons.length).toBeGreaterThan(0)
    expect(store.quickDiscounts.length).toBeGreaterThan(0)
    expect(store.selectingOrderCouponId).toBe(0)
    expect(store.orderCouponId).toBe(0)
    expect(store.currentDiscountName).toBe('')
  })

  it('hydratePromotionsFromServer() 覆蓋現有促銷設定', () => {
    const store = useDiscountStore()
    store.hydratePromotionsFromServer({
      orderCoupons: [{ id: 99, name: 'VIP專屬折價券', kind: 'amount', value: 300 }],
      quickDiscounts: [{ id: 'qd-1', name: '店長優惠', kind: 'percent', value: 0.85 }]
    })

    expect(store.orderCoupons).toHaveLength(1)
    expect(store.orderCoupons[0]?.name).toBe('VIP專屬折價券')
    expect(store.quickDiscounts).toHaveLength(1)
    expect(store.quickDiscounts[0]?.name).toBe('店長優惠')
  })
})
