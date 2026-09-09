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
      moneyDiscount: [{ id: 'money-1', name: '測試折價券', discountMoney: 99 }],
      percentDiscount: [{ id: 'percent-1', name: '測試折數', discountMoney: 0.5 }],
      quickDiscounts: [{ id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }],
    })

    expect(discountStore.promotionSource).toBe('server')
    expect(discountStore.moneyDiscount).toEqual([{ id: 'money-1', name: '測試折價券', discountMoney: 99 }])
    expect(discountStore.quickDiscounts).toEqual([{ id: 'quick-1', name: '測試快速折扣', kind: 'amount', value: 5 }])
  })

  it('已經同步過一次之後，再呼叫不會覆蓋本機（可能已被管理員編輯過）的資料', () => {
    setActivePinia(createPinia())
    const discountStore = useDiscountStore()
    const quickDiscounts = [{ id: 'quick-1', name: '測試快速折扣', kind: 'amount' as const, value: 5 }]

    discountStore.hydratePromotionsFromServer({
      moneyDiscount: [{ id: 'money-1', name: '測試折價券', discountMoney: 99 }],
      percentDiscount: [],
      quickDiscounts: [...quickDiscounts],
    })
    // 模擬管理員在背景設定頁新增了一張折價券。
    discountStore.moneyDiscount.push({ id: 'money-2', name: '管理員新增的折價券', discountMoney: 1 })

    discountStore.hydratePromotionsFromServer({
      moneyDiscount: [{ id: 'money-1', name: '測試折價券（伺服端又改了名字）', discountMoney: 99 }],
      percentDiscount: [],
      quickDiscounts: [...quickDiscounts],
    })

    expect(discountStore.moneyDiscount).toHaveLength(2)
    expect(discountStore.moneyDiscount[1]).toMatchObject({ name: '管理員新增的折價券' })
  })
})
