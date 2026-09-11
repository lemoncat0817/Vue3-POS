import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import {
  addOnOptions,
  categories,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  products
} from '../src/db/schema'
import { createTestDb } from './helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

describe('GET /api/catalog', () => {
  it('回傳分類、品項（含掛用的規格群組）與加購選項', async () => {
    const db = createTestDb()
    await db.insert(categories).values([{ id: 'c1', name: '主餐' }])
    await db
      .insert(modifierGroups)
      .values([{ id: 'mg1', name: '熟度', selectionType: 'single', required: true }])
    await db.insert(modifierOptions).values([
      { id: 'mo1', groupId: 'mg1', name: '五分熟', priceDelta: 0 },
      { id: 'mo2', groupId: 'mg1', name: '全熟', priceDelta: 0 }
    ])
    await db.insert(products).values([
      { id: 'i1', categoryId: 'c1', name: '招牌牛肉漢堡', basePrice: 180, stock: 20 },
      { id: 'i2', categoryId: 'c1', name: '烤雞三明治', basePrice: 150, stock: null }
    ])
    await db.insert(productModifierGroups).values([{ productId: 'i1', groupId: 'mg1' }])
    await db.insert(addOnOptions).values([{ id: 'a1', name: '加起司', price: 20 }])

    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({
      categories: [{ id: 'c1', name: '主餐' }],
      products: [
        {
          id: 'i1',
          categoryId: 'c1',
          name: '招牌牛肉漢堡',
          basePrice: 180,
          stock: 20,
          modifierGroupIds: ['mg1']
        },
        {
          id: 'i2',
          categoryId: 'c1',
          name: '烤雞三明治',
          basePrice: 150,
          stock: null,
          modifierGroupIds: []
        }
      ],
      modifierGroups: [
        {
          id: 'mg1',
          name: '熟度',
          selectionType: 'single',
          required: true,
          options: [
            { id: 'mo1', name: '五分熟', priceDelta: 0 },
            { id: 'mo2', name: '全熟', priceDelta: 0 }
          ]
        }
      ],
      addOns: [{ id: 'a1', name: '加起司', price: 20, stock: null }]
    })
  })

  it('沒有資料時回傳空陣列，不是錯誤', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      categories: [],
      products: [],
      modifierGroups: [],
      addOns: []
    })
  })

  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog')
    expect(res.status).toBe(401)
  })
})

describe('菜單管理寫入 API', () => {
  it('沒有裝置憑證時，新增分類拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })

  it('新增分類成功，id 由伺服端配發', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({ name: '主餐' })
    expect(typeof body.id).toBe('string')
    expect(body.id.length).toBeGreaterThan(0)
  })

  it('刪除還有品項的分類時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const category = await readJson(
      await app.request('/api/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ name: '主餐' })
      })
    )
    await app.request('/api/catalog/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        categoryId: category.id,
        name: '招牌牛肉漢堡',
        basePrice: 180,
        stock: null,
        modifierGroupIds: []
      })
    })

    const res = await app.request(`/api/catalog/categories/${category.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(409)
  })

  it('新增品項時找不到對應的分類，回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        categoryId: 'does-not-exist',
        name: '招牌牛肉漢堡',
        basePrice: 180,
        stock: null,
        modifierGroupIds: []
      })
    })
    expect(res.status).toBe(404)
  })

  it('新增品項時找不到對應的規格群組，回傳 404', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const category = await readJson(
      await app.request('/api/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ name: '主餐' })
      })
    )
    const res = await app.request('/api/catalog/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        categoryId: category.id,
        name: '招牌牛肉漢堡',
        basePrice: 180,
        stock: null,
        modifierGroupIds: ['does-not-exist']
      })
    })
    expect(res.status).toBe(404)
  })

  it('新增、編輯、刪除品項，異動反映在 GET /api/catalog', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const category = await readJson(
      await app.request('/api/catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ name: '主餐' })
      })
    )
    const item = await readJson(
      await app.request('/api/catalog/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({
          categoryId: category.id,
          name: '招牌牛肉漢堡',
          basePrice: 180,
          stock: null,
          modifierGroupIds: []
        })
      })
    )

    const updateRes = await app.request(`/api/catalog/products/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        categoryId: category.id,
        name: '特級牛肉漢堡',
        basePrice: 200,
        stock: 5,
        modifierGroupIds: []
      })
    })
    expect(updateRes.status).toBe(200)

    const afterUpdate = await readJson(await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } }))
    expect(afterUpdate.products[0]).toEqual({
      id: item.id,
      categoryId: category.id,
      name: '特級牛肉漢堡',
      basePrice: 200,
      stock: 5,
      modifierGroupIds: []
    })

    const deleteRes = await app.request(`/api/catalog/products/${item.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(deleteRes.status).toBe(204)

    const afterDelete = await readJson(await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } }))
    expect(afterDelete.products).toEqual([])
  })

  it('新增、編輯、刪除規格群組，異動反映在 GET /api/catalog', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const group = await readJson(
      await app.request('/api/catalog/modifier-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({
          name: '甜度',
          selectionType: 'single',
          required: true,
          options: [{ name: '正常糖', priceDelta: 0 }]
        })
      })
    )
    expect(group).toMatchObject({ name: '甜度', selectionType: 'single', required: true })
    expect(group.options).toHaveLength(1)

    const updateRes = await app.request(`/api/catalog/modifier-groups/${group.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        name: '甜度',
        selectionType: 'single',
        required: true,
        options: [
          { name: '正常糖', priceDelta: 0 },
          { name: '半糖', priceDelta: 0 }
        ]
      })
    })
    expect(updateRes.status).toBe(200)
    const updated = await readJson(updateRes)
    expect(updated.options).toHaveLength(2)

    const deleteRes = await app.request(`/api/catalog/modifier-groups/${group.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(deleteRes.status).toBe(204)

    const after = await readJson(await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } }))
    expect(after.modifierGroups).toEqual([])
  })

  it('新增、編輯、刪除加購選項，異動反映在 GET /api/catalog', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const addOn = await readJson(
      await app.request('/api/catalog/add-ons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ name: '加起司', price: 20, stock: null })
      })
    )
    expect(addOn).toMatchObject({ name: '加起司', price: 20, stock: null })

    const updateRes = await app.request(`/api/catalog/add-ons/${addOn.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '加起司', price: 25, stock: null })
    })
    expect(updateRes.status).toBe(200)

    const deleteRes = await app.request(`/api/catalog/add-ons/${addOn.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(deleteRes.status).toBe(204)

    const after = await readJson(await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } }))
    expect(after.addOns).toEqual([])
  })
})
