import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { moneyCoupons, oftenUseRates, percentCoupons } from '../src/db/schema'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

const validLine = {
  name: '楊枝甘露2.0',
  price: 80,
  size: 'L',
  count: 1,
  addList: '無添加配料' as const,
  addListPrice: 0,
  freeDiscount: false,
  ecoDiscount: false,
  bottleDiscount: false,
  oftenUseDiscount1: false,
  oftenUseDiscount2: false,
  oftenUseDiscount3: false,
}

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    businessDate: '20240610',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    tenders: [{ method: '現金', amount: 80 }],
    appliedCoupon: { type: 'none' },
    orderChannel: '外帶',
    invoiceCarrier: { type: '無載具' },
    ...overrides,
  }
}

/**
 * P23（規劃書 §10 P23「電子發票平台串接」）：電子發票字軌與模擬批次
 * 上傳，見 db/schema.ts 的 invoiceTracks／orders.invoiceStatus 說明。
 */
describe('沒有啟用中的字軌時，送單依號碼核發失敗（P23）', () => {
  it('沒有任何字軌時，送單回 400 而不是沒說明原因的 500', async () => {
    // 這裡刻意不呼叫 seedPromotions（它現在會順便建立測試用字軌，見
    // helpers/promotions.ts），單獨測「完全沒有字軌」這個狀況。
    const db = createTestDb()
    await db.insert(oftenUseRates).values([
      { slot: 0, name: '環保折扣', discountMoney: 5, discountPercent: 1 },
      { slot: 1, name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
      { slot: 2, name: '九折', discountMoney: 0, discountPercent: 0.9 },
      { slot: 3, name: '八五折', discountMoney: 0, discountPercent: 0.85 },
      { slot: 4, name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
    ])
    await db.insert(moneyCoupons).values([{ id: 'money-1', name: '$50折價券', discountMoney: 50 }])
    await db.insert(percentCoupons).values([{ id: 'percent-1', name: '整單95折', discountPercent: 0.95 }])
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest()),
    })
    expect(res.status).toBe(400)
    expect((await readJson(res)).error).toContain('字軌')
  })
})

describe('GET/POST /api/invoices/tracks', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    expect((await app.request('/api/invoices/tracks')).status).toBe(401)
    expect(
      (
        await app.request('/api/invoices/tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackCode: 'AB', periodLabel: '2026年01-02月', rangeStart: 1, rangeEnd: 1000 }),
        })
      ).status,
    ).toBe(401)
  })

  it('新增字軌會自動設為啟用中，並停用其他字軌；之後送單用新字軌配號', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const headers = { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken }

    const created = await readJson(
      await app.request('/api/invoices/tracks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ trackCode: 'AB', periodLabel: '2026年01-02月', rangeStart: 1, rangeEnd: 1000 }),
      }),
    )
    expect(created).toMatchObject({ trackCode: 'AB', isActive: true, currentNumber: 0 })

    const tracks = await readJson(await app.request('/api/invoices/tracks', { headers: { 'X-Device-Token': deviceToken } }))
    expect(tracks).toHaveLength(2)
    const oldTrack = tracks.find((t: { id: string }) => t.id !== created.id)
    expect(oldTrack.isActive).toBe(false)

    const orderRes = await app.request('/api/orders', { method: 'POST', headers, body: JSON.stringify(buildRequest()) })
    const order = await readJson(orderRes)
    expect(order.invoiceNumber).toMatch(/^AB\d{8}$/)
  })
})

describe('POST /api/invoices/submit（模擬批次上傳）', () => {
  it('把目前所有已開立、尚未上傳的發票標成已上傳，回傳筆數與時間；再送一次是 0 筆', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const headers = { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken }

    const order1 = await readJson(await app.request('/api/orders', { method: 'POST', headers, body: JSON.stringify(buildRequest()) }))
    const order2 = await readJson(
      await app.request('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA2' })),
      }),
    )
    expect(order1.invoiceStatus).toBe('issued')

    const submitRes = await app.request('/api/invoices/submit', { method: 'POST', headers: { 'X-Device-Token': deviceToken } })
    expect(submitRes.status).toBe(200)
    const submitBody = await readJson(submitRes)
    expect(submitBody.submittedCount).toBe(2)
    expect(typeof submitBody.submittedAt).toBe('string')

    const list = await readJson(await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } }))
    const updated1 = list.find((o: { orderId: string }) => o.orderId === order1.orderId)
    const updated2 = list.find((o: { orderId: string }) => o.orderId === order2.orderId)
    expect(updated1.invoiceStatus).toBe('submitted')
    expect(updated2.invoiceStatus).toBe('submitted')
    expect(updated1.invoiceSubmittedAt).toBe(submitBody.submittedAt)

    // 再送一次沒有新的待上傳發票。
    const secondSubmit = await readJson(
      await app.request('/api/invoices/submit', { method: 'POST', headers: { 'X-Device-Token': deviceToken } }),
    )
    expect(secondSubmit.submittedCount).toBe(0)
  })
})

describe('作廢訂單時發票一併標成作廢（P23）', () => {
  it('訂單作廢（已取消）時 invoiceStatus 變成 voided；撤銷作廢改回 issued', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const headers = { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken }

    const order = await readJson(await app.request('/api/orders', { method: 'POST', headers, body: JSON.stringify(buildRequest()) }))

    const voidRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '客人取消' }),
    })
    expect((await readJson(voidRes)).invoiceStatus).toBe('voided')

    const restoreRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已完成', operator: '店長 - Lemon' }),
    })
    expect((await readJson(restoreRes)).invoiceStatus).toBe('issued')
  })
})
