import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useDrinkStore } from './drink'

/** 驗證 hydrateCatalogFromServer() 僅初次注入伺服端資料，避免覆蓋本機編輯。 */
describe('useDrinkStore — hydrateCatalogFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const drinkStore = useDrinkStore()

    expect(drinkStore.catalogSource).toBe('seed')
    drinkStore.hydrateCatalogFromServer({
      groups: [{ id: 'g1', name: '測試系列', type: 'test', drinkList: [] }],
      addOns: [{ id: 'a1', name: '測試加料', price: 5 }],
    })

    expect(drinkStore.catalogSource).toBe('server')
    expect(drinkStore.drinkType).toEqual([{ id: 'g1', name: '測試系列', type: 'test', drinkList: [] }])
    expect(drinkStore.drinkAdd).toEqual([{ id: 'a1', name: '測試加料', price: 5 }])
  })

  it('已經同步過一次之後，再呼叫不會覆蓋本機（可能已被管理員編輯過）的資料', () => {
    setActivePinia(createPinia())
    const drinkStore = useDrinkStore()

    drinkStore.hydrateCatalogFromServer({
      groups: [{ id: 'g1', name: '測試系列', type: 'test', drinkList: [] }],
      addOns: [],
    })
    // 模擬管理員在背景設定頁新增了一個系列。
    drinkStore.drinkType.push({ id: 'g2', name: '管理員新增的系列', type: 'custom', drinkList: [] })

    drinkStore.hydrateCatalogFromServer({
      groups: [{ id: 'g1', name: '測試系列（伺服端又改了名字）', type: 'test', drinkList: [] }],
      addOns: [],
    })

    // 第二次呼叫應該被忽略：本機新增的系列還在，名字也沒被伺服端覆蓋。
    expect(drinkStore.drinkType).toHaveLength(2)
    expect(drinkStore.drinkType[1]).toMatchObject({ name: '管理員新增的系列' })
  })
})
