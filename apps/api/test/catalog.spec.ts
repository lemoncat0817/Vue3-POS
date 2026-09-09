import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { addOnOptions, catalogGroups, catalogItems } from '../src/db/schema'
import { createTestDb } from './helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

describe('GET /api/catalog', () => {
  it('回傳依系列分組的菜單與加料選項', async () => {
    const db = createTestDb()
    await db.insert(catalogGroups).values([{ id: 'g1', name: '原味茶', type: 'drinkOriginal' }])
    await db.insert(catalogItems).values([
      { id: 'i1', groupId: 'g1', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both', stock: 20 },
      { id: 'i2', groupId: 'g1', name: '錫蘭紅茶', priceL: 30, priceBottle: null, customized: 'none' },
    ])
    await db.insert(addOnOptions).values([{ id: 'a1', name: '珍珠', price: 10 }])

    const app = createTestApp(db)
    const res = await app.request('/api/catalog')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({
      groups: [
        {
          id: 'g1',
          name: '原味茶',
          type: 'drinkOriginal',
          items: [
            { id: 'i1', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both', stock: 20 },
            { id: 'i2', name: '錫蘭紅茶', priceL: 30, priceBottle: null, customized: 'none', stock: null },
          ],
        },
      ],
      addOns: [{ id: 'a1', name: '珍珠', price: 10, stock: null }],
    })
  })

  it('沒有資料時回傳空陣列，不是錯誤', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ groups: [], addOns: [] })
  })
})

describe('菜單管理寫入 API', () => {
  it('沒有裝置憑證時，新增飲品類型拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '原味茶', type: 'drinkOriginal' }),
    })
    expect(res.status).toBe(401)
  })

  it('新增飲品類型成功，id 由伺服端配發', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '原味茶', type: 'drinkOriginal' }),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({ name: '原味茶', type: 'drinkOriginal' })
    expect(typeof body.id).toBe('string')
    expect(body.id.length).toBeGreaterThan(0)
  })

  it('刪除還有品項的飲品類型時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const group = await readJson(
      await app.request('/api/catalog/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ name: '原味茶', type: 'drinkOriginal' }),
      }),
    )
    await app.request('/api/catalog/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ groupId: group.id, name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both', stock: null }),
    })

    const res = await app.request(`/api/catalog/groups/${group.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(409)
  })

  it('新增品項時找不到對應的飲品類型，回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ groupId: 'does-not-exist', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both', stock: null }),
    })
    expect(res.status).toBe(404)
  })

  it('新增、編輯、刪除品項，異動反映在 GET /api/catalog', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const group = await readJson(
      await app.request('/api/catalog/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ name: '原味茶', type: 'drinkOriginal' }),
      }),
    )
    const item = await readJson(
      await app.request('/api/catalog/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ groupId: group.id, name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both', stock: null }),
      }),
    )

    const updateRes = await app.request(`/api/catalog/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ groupId: group.id, name: '特級翡翠綠茶', priceL: 35, priceBottle: 50, customized: 'both', stock: 5 }),
    })
    expect(updateRes.status).toBe(200)

    const afterUpdate = await readJson(await app.request('/api/catalog'))
    expect(afterUpdate.groups[0].items[0]).toEqual({ id: item.id, name: '特級翡翠綠茶', priceL: 35, priceBottle: 50, customized: 'both', stock: 5 })

    const deleteRes = await app.request(`/api/catalog/items/${item.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(deleteRes.status).toBe(204)

    const afterDelete = await readJson(await app.request('/api/catalog'))
    expect(afterDelete.groups[0].items).toEqual([])
  })

  it('新增、編輯、刪除配料，異動反映在 GET /api/catalog', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const addOn = await readJson(
      await app.request('/api/catalog/add-ons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ name: '珍珠', price: 10, stock: null }),
      }),
    )
    expect(addOn).toMatchObject({ name: '珍珠', price: 10, stock: null })

    const updateRes = await app.request(`/api/catalog/add-ons/${addOn.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '珍珠', price: 15, stock: null }),
    })
    expect(updateRes.status).toBe(200)

    const deleteRes = await app.request(`/api/catalog/add-ons/${addOn.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(deleteRes.status).toBe(204)

    const after = await readJson(await app.request('/api/catalog'))
    expect(after.addOns).toEqual([])
  })
})
