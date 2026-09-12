import { describe, expect, it } from 'vitest'
import type { CatalogResponse } from '@pos/contract'
import { toLocalCategories, toLocalModifierGroups, toLocalProducts } from './catalog'

const sampleCatalog: CatalogResponse = {
  categories: [{ id: 'cat-1', name: '主餐' }],
  products: [
    {
      id: 'prod-1',
      categoryId: 'cat-1',
      name: '招牌牛肉漢堡',
      basePrice: 180,
      stock: 20,
      modifierGroupIds: ['mg-1']
    },
    {
      id: 'prod-2',
      categoryId: 'cat-1',
      name: '烤雞三明治',
      basePrice: 150,
      stock: null,
      modifierGroupIds: []
    }
  ],
  modifierGroups: [
    {
      id: 'mg-1',
      name: '熟度',
      selectionType: 'single',
      required: true,
      options: [{ id: 'mo-1', name: '五分熟', priceDelta: 0, stock: null }]
    },
    {
      id: 'mg-2',
      name: '加料',
      selectionType: 'multiple',
      required: false,
      options: [{ id: 'mo-2', name: '加起司', priceDelta: 20, stock: null }]
    }
  ]
}

describe('toLocalCategories / toLocalProducts', () => {
  it('保留分類與品項的完整欄位', () => {
    expect(toLocalCategories(sampleCatalog)).toEqual([{ id: 'cat-1', name: '主餐' }])
    expect(toLocalProducts(sampleCatalog)).toEqual([
      {
        id: 'prod-1',
        categoryId: 'cat-1',
        name: '招牌牛肉漢堡',
        basePrice: 180,
        stock: 20,
        modifierGroupIds: ['mg-1']
      },
      {
        id: 'prod-2',
        categoryId: 'cat-1',
        name: '烤雞三明治',
        basePrice: 150,
        stock: null,
        modifierGroupIds: []
      }
    ])
  })
})

describe('toLocalModifierGroups', () => {
  it('保留規格群組與選項的完整欄位，含加購用途（多選）的群組與選項庫存', () => {
    expect(toLocalModifierGroups(sampleCatalog)).toEqual([
      {
        id: 'mg-1',
        name: '熟度',
        selectionType: 'single',
        required: true,
        options: [{ id: 'mo-1', name: '五分熟', priceDelta: 0, stock: null }]
      },
      {
        id: 'mg-2',
        name: '加料',
        selectionType: 'multiple',
        required: false,
        options: [{ id: 'mo-2', name: '加起司', priceDelta: 20, stock: null }]
      }
    ])
  })
})
