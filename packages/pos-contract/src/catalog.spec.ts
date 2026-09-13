import { describe, expect, it } from 'vitest'
import {
  catalogResponseSchema,
  catalogStockSchema,
  createCategoryRequestSchema,
  createModifierGroupRequestSchema,
  createProductRequestSchema,
  modifierGroupSchema,
  modifierOptionSchema,
  modifierSelectionTypeSchema,
  productSchema
} from './catalog'

describe('catalog schema primitives', () => {
  it('modifierSelectionTypeSchema 僅接受 single 與 multiple', () => {
    expect(modifierSelectionTypeSchema.safeParse('single').success).toBe(true)
    expect(modifierSelectionTypeSchema.safeParse('multiple').success).toBe(true)
    expect(modifierSelectionTypeSchema.safeParse('other').success).toBe(false)
  })

  it('catalogStockSchema 接受 null 或非負整數', () => {
    expect(catalogStockSchema.safeParse(null).success).toBe(true)
    expect(catalogStockSchema.safeParse(0).success).toBe(true)
    expect(catalogStockSchema.safeParse(100).success).toBe(true)
    expect(catalogStockSchema.safeParse(-1).success).toBe(false)
    expect(catalogStockSchema.safeParse(1.5).success).toBe(false)
  })
})

describe('modifierOptionSchema & modifierGroupSchema', () => {
  it('驗證合法規格選項與群組', () => {
    const opt = {
      id: 'opt-1',
      name: '半糖',
      priceDelta: 0,
      stock: null
    }
    expect(modifierOptionSchema.safeParse(opt).success).toBe(true)

    const group = {
      id: 'grp-1',
      name: '甜度',
      selectionType: 'single' as const,
      required: true,
      options: [opt]
    }
    expect(modifierGroupSchema.safeParse(group).success).toBe(true)
  })
})

describe('productSchema & catalogResponseSchema', () => {
  const sampleProduct = {
    id: 'prod-1',
    categoryId: 'cat-1',
    name: '珍珠奶茶',
    basePrice: 50,
    stock: 100,
    modifierGroupIds: ['grp-1']
  }

  it('驗證合法品項物件', () => {
    expect(productSchema.safeParse(sampleProduct).success).toBe(true)
  })

  it('拒絕負數底價品項', () => {
    expect(productSchema.safeParse({ ...sampleProduct, basePrice: -10 }).success).toBe(false)
  })

  it('驗證整份 catalogResponseSchema', () => {
    const response = {
      categories: [{ id: 'cat-1', name: '茶飲' }],
      products: [sampleProduct],
      modifierGroups: [
        {
          id: 'grp-1',
          name: '甜度',
          selectionType: 'single' as const,
          required: true,
          options: [{ id: 'opt-1', name: '微糖', priceDelta: 0, stock: null }]
        }
      ]
    }
    expect(catalogResponseSchema.safeParse(response).success).toBe(true)
  })
})

describe('catalog mutation requests', () => {
  it('驗證建立分類請求', () => {
    expect(createCategoryRequestSchema.safeParse({ name: '點心' }).success).toBe(true)
    expect(createCategoryRequestSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('驗證建立品項請求', () => {
    expect(
      createProductRequestSchema.safeParse({
        categoryId: 'cat-1',
        name: '紅茶',
        basePrice: 30,
        stock: null,
        modifierGroupIds: []
      }).success
    ).toBe(true)
  })

  it('驗證建立規格群組請求', () => {
    expect(
      createModifierGroupRequestSchema.safeParse({
        name: '冰塊',
        selectionType: 'single',
        required: true,
        options: [{ name: '去冰', priceDelta: 0, stock: null }]
      }).success
    ).toBe(true)
  })
})
