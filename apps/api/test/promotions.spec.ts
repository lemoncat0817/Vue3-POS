import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'

describe('GET /api/promotions', () => {
  it('不需要裝置憑證，回傳訂單折價券與快速折扣清單', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const app = createTestApp(db)

    const res = await app.request('/api/promotions')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      orderCoupons: unknown[]
      quickDiscounts: unknown[]
    }
    expect(body.orderCoupons).toHaveLength(3)
    expect(body.quickDiscounts).toHaveLength(3)
  })

  it('沒有資料時回傳空陣列（清單可自由增刪，沒有固定筆數限制）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/promotions')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ orderCoupons: [], quickDiscounts: [] })
  })
})

describe('POST /api/promotions/order-coupons', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/promotions/order-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '$50折價券', kind: 'amount', value: 50 }),
    })
    expect(res.status).toBe(401)
  })

  it('有裝置憑證時建立成功', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/order-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '$50折價券', kind: 'amount', value: 50 }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { id: string; name: string; kind: string; value: number }
    expect(body).toMatchObject({ name: '$50折價券', kind: 'amount', value: 50 })
    expect(body.id).toBeTruthy()
  })
})

describe('DELETE /api/promotions/order-coupons/:id', () => {
  it('刪除存在的折價券回傳 204，之後就不在清單裡', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const del = await app.request('/api/promotions/order-coupons/money-1', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(del.status).toBe(204)

    const list = (await (await app.request('/api/promotions')).json()) as { orderCoupons: Array<{ id: string }> }
    expect(list.orderCoupons.find((c) => c.id === 'money-1')).toBeUndefined()
  })

  it('刪除不存在的折價券回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/order-coupons/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/promotions/order-coupons/:id', () => {
  it('更新存在的現金折價券', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/order-coupons/money-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '$80折價券', kind: 'amount', value: 80 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; name: string; kind: string; value: number }
    expect(body).toMatchObject({ id: 'money-1', name: '$80折價券', kind: 'amount', value: 80 })
  })

  it('更新存在的折數折價券', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/order-coupons/percent-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '整單9折', kind: 'percent', value: 0.9 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; name: string; kind: string; value: number }
    expect(body).toMatchObject({ id: 'percent-1', name: '整單9折', kind: 'percent', value: 0.9 })
  })

  it('更新不存在的折價券回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/order-coupons/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: 'x', kind: 'amount', value: 1 }),
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/promotions/quick-discounts', () => {
  it('建立成功，id 由伺服端配發（清單可自由新增，不受固定筆數限制）', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/quick-discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '生日優惠', kind: 'percent', value: 0.8 }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { id: string; name: string; kind: string; value: number }
    expect(body).toMatchObject({ name: '生日優惠', kind: 'percent', value: 0.8 })
    expect(body.id).toBeTruthy()
  })
})

describe('PUT /api/promotions/quick-discounts/:id', () => {
  it('更新指定 id 的內容，不影響其他筆', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/quick-discounts/quick-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '常客優惠（調整後）', kind: 'amount', value: 8 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; name: string; value: number }
    expect(body).toMatchObject({ id: 'quick-1', name: '常客優惠（調整後）', value: 8 })

    const list = (await (await app.request('/api/promotions')).json()) as {
      quickDiscounts: Array<{ id: string; name: string }>
    }
    expect(list.quickDiscounts.find((d) => d.id === 'quick-1')).toMatchObject({ name: '常客優惠（調整後）' })
    expect(list.quickDiscounts.find((d) => d.id === 'quick-2')).toMatchObject({ name: '大宗採購優惠' })
  })

  it('更新不存在的快速折扣回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/quick-discounts/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: 'x', kind: 'amount', value: 0 }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/promotions/quick-discounts/:id', () => {
  it('刪除存在的快速折扣回傳 204，之後就不在清單裡', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/promotions/quick-discounts/quick-1', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(204)

    const list = (await (await app.request('/api/promotions')).json()) as { quickDiscounts: Array<{ id: string }> }
    expect(list.quickDiscounts.find((d) => d.id === 'quick-1')).toBeUndefined()
  })

  it('刪除不存在的快速折扣回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/promotions/quick-discounts/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })
})
