import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useDiscountStore } from './discount'

describe('useDiscountStore — hydratePromotionsFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const discountStore = useDiscountStore()

    discountStore.hydratePromotionsFromServer({
      orderCoupons: [{ id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }],
      quickDiscounts: [{ id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }]
    })

    expect(discountStore.orderCoupons).toEqual([
      { id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }
    ])
    expect(discountStore.quickDiscounts).toEqual([
      { id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }
    ])
  })

  it('再次呼叫會用最新的伺服端資料整份覆蓋，包含本機在這之間做的異動', () => {
    setActivePinia(createPinia())
    const discountStore = useDiscountStore()
    const quickDiscounts = [
      { id: 'quick-1', name: '測試快速折扣', kind: 'amount' as const, value: 5 }
    ]

    discountStore.hydratePromotionsFromServer({
      orderCoupons: [{ id: 'money-1', name: '測試折價券', kind: 'amount', value: 99 }],
      quickDiscounts: [...quickDiscounts]
    })
    discountStore.orderCoupons.push({
      id: 'money-2',
      name: '管理員新增的折價券',
      kind: 'amount',
      value: 1
    })

    discountStore.hydratePromotionsFromServer({
      orderCoupons: [
        { id: 'money-1', name: '測試折價券（伺服端又改了名字）', kind: 'amount', value: 99 }
      ],
      quickDiscounts: [...quickDiscounts]
    })

    expect(discountStore.orderCoupons).toEqual([
      { id: 'money-1', name: '測試折價券（伺服端又改了名字）', kind: 'amount', value: 99 }
    ])
  })
})
