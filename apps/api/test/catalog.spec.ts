import { describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/app'
import { addOnOptions, catalogGroups, catalogItems } from '../src/db/schema'
import { createTestDb } from './helpers/db'

describe('GET /api/catalog', () => {
  it('回傳依系列分組的菜單與加料選項', async () => {
    const db = createTestDb()
    await db.insert(catalogGroups).values([{ id: 'g1', name: '原味茶', type: 'drinkOriginal' }])
    await db.insert(catalogItems).values([
      { id: 'i1', groupId: 'g1', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both' },
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
            { id: 'i1', name: '翡翠綠茶', priceL: 30, priceBottle: 45, customized: 'both' },
            { id: 'i2', name: '錫蘭紅茶', priceL: 30, priceBottle: null, customized: 'none' },
          ],
        },
      ],
      addOns: [{ id: 'a1', name: '珍珠', price: 10 }],
    })
  })

  it('沒有資料時回傳空陣列，不是錯誤', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ groups: [], addOns: [] })
  })
})
