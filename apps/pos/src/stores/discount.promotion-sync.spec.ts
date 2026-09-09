import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useDiscountStore } from './discount'

/** 驗證 hydratePromotionsFromServer() 僅初次注入伺服端資料，避免覆蓋本機編輯。 */
describe('useDiscountStore — hydratePromotionsFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const discountStore = useDiscountStore()

    expect(discountStore.promotionSource).toBe('seed')
    discountStore.hydratePromotionsFromServer({
      orderCoupons: [{ id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }],
      quickDiscounts: [{ id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }],
    })

    expect(discountStore.promotionSource).toBe('server')
    expect(discountStore.orderCoupons).toEqual([{ id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }])
    expect(discountStore.quickDiscounts).toEqual([{ id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }])
  })

  it('已經同步過一次之後，再呼叫不會覆蓋本機（可能已被管理員編輯過）的資料', () => {
    setActivePinia(createPinia())
    const discountStore = useDiscountStore()
    const quickDiscounts = [{ id: 'quick-1', name: '測試快速折扣', kind: 'amount' as const, value: 5 }]

    discountStore.hydratePromotionsFromServer({
      orderCoupons: [{ id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }],
      quickDiscounts: [...quickDiscounts],
    })
    // 模擬管理員在背景設定頁新增了一張折價券。
    discountStore.orderCoupons.push({ id: 'money-2', name: '管理員新增的折價券', kind: 'amount', value: 1 })

    discountStore.hydratePromotionsFromServer({
      orderCoupons: [{ id: 'money-1', name: '測試折價券（伺服端又改了名字）', kind: 'amount', value: 99 }],
      quickDiscounts: [...quickDiscounts],
    })

    expect(discountStore.orderCoupons).toHaveLength(2)
    expect(discountStore.orderCoupons[1]).toMatchObject({ name: '管理員新增的折價券' })
  })
})
