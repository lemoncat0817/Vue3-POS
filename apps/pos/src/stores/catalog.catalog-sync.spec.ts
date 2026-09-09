import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useCatalogStore } from './catalog'

/** 驗證 hydrateCatalogFromServer() 僅初次注入伺服端資料，避免覆蓋本機編輯。 */
describe('useCatalogStore — hydrateCatalogFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const catalogStore = useCatalogStore()

    expect(catalogStore.catalogSource).toBe('seed')
    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類' }],
      products: [],
      modifierGroups: [],
      addOns: [{ id: 'a1', name: '測試加購', price: 5, stock: null }],
    })

    expect(catalogStore.catalogSource).toBe('server')
    expect(catalogStore.categories).toEqual([{ id: 'cat-1', name: '測試分類' }])
    expect(catalogStore.addOns).toEqual([{ id: 'a1', name: '測試加購', price: 5, stock: null }])
  })

  it('已經同步過一次之後，再呼叫不會覆蓋本機（可能已被管理員編輯過）的資料', () => {
    setActivePinia(createPinia())
    const catalogStore = useCatalogStore()

    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類' }],
      products: [],
      modifierGroups: [],
      addOns: [],
    })
    // 模擬管理員在背景設定頁新增了一個分類。
    catalogStore.categories.push({ id: 'cat-2', name: '管理員新增的分類' })

    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類（伺服端又改了名字）' }],
      products: [],
      modifierGroups: [],
      addOns: [],
    })

    // 第二次呼叫應該被忽略：本機新增的分類還在，名字也沒被伺服端覆蓋。
    expect(catalogStore.categories).toHaveLength(2)
    expect(catalogStore.categories[1]).toMatchObject({ name: '管理員新增的分類' })
  })
})
