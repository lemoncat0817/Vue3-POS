import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useCatalogStore } from './catalog'

describe('useCatalogStore — hydrateCatalogFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const catalogStore = useCatalogStore()

    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類' }],
      products: [],
      modifierGroups: [
        {
          id: 'mg-1',
          name: '測試加購',
          selectionType: 'multiple',
          required: false,
          options: [{ id: 'mo-1', name: '測試選項', priceDelta: 5, stock: null }]
        }
      ]
    })

    expect(catalogStore.categories).toEqual([{ id: 'cat-1', name: '測試分類' }])
    expect(catalogStore.modifierGroups).toEqual([
      {
        id: 'mg-1',
        name: '測試加購',
        selectionType: 'multiple',
        required: false,
        options: [{ id: 'mo-1', name: '測試選項', priceDelta: 5, stock: null }]
      }
    ])
  })

  it('再次呼叫會用最新的伺服端資料整份覆蓋，包含本機在這之間做的異動', () => {
    setActivePinia(createPinia())
    const catalogStore = useCatalogStore()

    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類' }],
      products: [],
      modifierGroups: []
    })
    catalogStore.categories.push({ id: 'cat-2', name: '管理員新增的分類' })

    catalogStore.hydrateCatalogFromServer({
      categories: [{ id: 'cat-1', name: '測試分類（伺服端又改了名字）' }],
      products: [],
      modifierGroups: []
    })

    expect(catalogStore.categories).toEqual([{ id: 'cat-1', name: '測試分類（伺服端又改了名字）' }])
  })
})
