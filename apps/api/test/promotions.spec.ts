import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'

describe('GET /api/promotions', () => {
  it('不需要裝置憑證，回傳現金／折數折價券與 5 筆常用折扣', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const app = createTestApp(db)

    const res = await app.request('/api/promotions')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      moneyCoupons: unknown[]
      percentCoupons: unknown[]
      oftenUseRates: unknown[]
    }
    expect(body.moneyCoupons).toHaveLength(2)
    expect(body.percentCoupons).toHaveLength(1)
    expect(body.oftenUseRates).toHaveLength(5)
  })

  it('沒有資料時回傳空陣列，但常用折扣缺資料會直接出錯（見 routes/promotions.ts 的設計說明）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/promotions')
    expect(res.status).toBe(500)
  })
})

describe('POST /api/promotions/money-coupons', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/promotions/money-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '$50折價券', discountMoney: 50 }),
    })
    expect(res.status).toBe(401)
  })

  it('有裝置憑證時建立成功', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/money-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '$50折價券', discountMoney: 50 }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { id: string; name: string; discountMoney: number }
    expect(body).toMatchObject({ name: '$50折價券', discountMoney: 50 })
    expect(body.id).toBeTruthy()
  })
})

describe('DELETE /api/promotions/money-coupons/:id', () => {
  it('刪除存在的折價券回傳 204，之後就不在清單裡', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const del = await app.request('/api/promotions/money-coupons/money-1', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(del.status).toBe(204)

    const list = (await (await app.request('/api/promotions')).json()) as { moneyCoupons: Array<{ id: string }> }
    expect(list.moneyCoupons.find((c) => c.id === 'money-1')).toBeUndefined()
  })

  it('刪除不存在的折價券回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/money-coupons/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/promotions/money-coupons/:id', () => {
  it('更新存在的折價券', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/money-coupons/money-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '$80折價券', discountMoney: 80 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; name: string; discountMoney: number }
    expect(body).toMatchObject({ id: 'money-1', name: '$80折價券', discountMoney: 80 })
  })

  it('更新不存在的折價券回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/money-coupons/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: 'x', discountMoney: 1 }),
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/promotions/percent-coupons/:id', () => {
  it('更新存在的折價券', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/percent-coupons/percent-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '整單9折', discountPercent: 0.9 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; name: string; discountPercent: number }
    expect(body).toMatchObject({ id: 'percent-1', name: '整單9折', discountPercent: 0.9 })
  })
})

describe('PUT /api/promotions/often-use-rates/:slot', () => {
  it('更新指定 slot 的內容，不影響其他 slot', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/often-use-rates/0', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '環保折扣（調整後）', discountMoney: 8, discountPercent: 1 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { slot: number; name: string; discountMoney: number }
    expect(body).toMatchObject({ slot: 0, name: '環保折扣（調整後）', discountMoney: 8 })

    const list = (await (await app.request('/api/promotions')).json()) as {
      oftenUseRates: Array<{ slot: number; name: string }>
    }
    expect(list.oftenUseRates[0]).toMatchObject({ name: '環保折扣（調整後）' })
    expect(list.oftenUseRates[1]).toMatchObject({ name: '瓶裝折扣' })
  })

  it('slot 超出 0～4 範圍時驗證失敗', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/often-use-rates/9', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: 'x', discountMoney: 0, discountPercent: 1 }),
    })
    expect(res.status).toBe(400)
  })
})
