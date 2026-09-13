import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { categories, modifierGroups, modifierOptions, productModifierGroups, products } from '../src/db/schema'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

const validLine = {
  name: '楊枝甘露2.0',
  price: 80,
  count: 2,
  addList: '無添加配料' as const,
  addListPrice: 0,
  freeDiscount: false,
  quickDiscountId: null
}

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    businessDate: '20260101',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    tenders: [{ method: '現金', amount: 160 }],
    appliedCoupon: { type: 'none' },
    orderChannel: '外帶',
    invoiceCarrier: { type: '無載具' },
    ...overrides
  }
}

// 2026-01-01T02:00:00.000Z（UTC）＝台北時間 2026/01/01 10:00（見
// routes/reports.ts 的 +8 小時位移換算說明）。固定時鐘讓 hourlyRevenue
// 的小時分桶可預期，不受測試實際執行時間影響。
const FIXED_ORDER_TIME = new Date('2026-01-01T02:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_ORDER_TIME)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/reports/sales', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260101&to=20260101')
    expect(res.status).toBe(401)
  })

  it('帶裝置憑證即可查詢', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260101&to=20260101', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
  })

  it('from 晚於 to 時回傳 400', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260107&to=20260101', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(400)
  })

  it('dailyRevenue 涵蓋查詢範圍內每一天，沒有訂單的日子是 0，不是缺漏', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260101&to=20260103', {
      headers: { 'X-Device-Token': deviceToken }
    })
    const body = await readJson(res)
    expect(body.dailyRevenue).toEqual([
      { businessDate: '20260101', revenue: 0 },
      { businessDate: '20260102', revenue: 0 },
      { businessDate: '20260103', revenue: 0 }
    ])
  })

  it('營業額、小時分桶、熱銷飲料／配料／付款方式都直接來自 D1 的聚合結果，不是用戶端算好回傳的數字', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    await db.insert(categories).values([{ id: 'cat-1', name: '飲品' }])
    await db.insert(products).values([
      { id: 'prod-1', categoryId: 'cat-1', name: '楊枝甘露2.0', basePrice: 80, stock: null },
      { id: 'prod-2', categoryId: 'cat-1', name: '珍珠奶茶', basePrice: 80, stock: null }
    ])
    await db
      .insert(modifierGroups)
      .values([{ id: 'mg1', name: '加料', selectionType: 'multiple', required: false }])
    await db.insert(modifierOptions).values([
      { id: 'mo1', groupId: 'mg1', name: '珍珠', priceDelta: 10, stock: null },
      { id: 'mo2', groupId: 'mg1', name: '椰果', priceDelta: 10, stock: null }
    ])
    await db.insert(productModifierGroups).values([{ productId: 'prod-2', groupId: 'mg1' }])
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    // 兩杯楊枝甘露（無配料）+ 一杯有加珍珠、椰果的飲料，同一張訂單。
    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [
            validLine,
            { ...validLine, name: '珍珠奶茶', count: 1, addList: ['珍珠', '椰果'] }
          ],
          tenders: [{ method: '現金', amount: 240 }] // 160 + 80
        })
      )
    })
    expect(createRes.status).toBe(201)
    const created = await readJson(createRes)

    const res = await app.request('/api/reports/sales?from=20260101&to=20260101', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    const body = await readJson(res)

    expect(body.dailyRevenue).toEqual([
      { businessDate: '20260101', revenue: created.orderPaymentPrice }
    ])

    const hourTen = body.hourlyRevenue.find((point: { hour: number }) => point.hour === 10)
    expect(hourTen.revenue).toBe(created.orderPaymentPrice)
    const otherHours = body.hourlyRevenue.filter((point: { hour: number }) => point.hour !== 10)
    expect(otherHours.every((point: { revenue: number }) => point.revenue === 0)).toBe(true)

    expect(body.topProducts).toEqual(
      expect.arrayContaining([
        { name: '楊枝甘露2.0', count: 2 },
        { name: '珍珠奶茶', count: 1 }
      ])
    )
    // '無添加配料' 那兩杯不該出現在配料排行——json_type 過濾掉非陣列的 addList。
    expect(body.topAddOns).toEqual(
      expect.arrayContaining([
        { name: '珍珠', count: 1 },
        { name: '椰果', count: 1 }
      ])
    )
    expect(body.topAddOns).toHaveLength(2)
    expect(body.topPaymentMethods).toEqual([{ name: '現金', count: 1 }])
    expect(body.orderCount).toBe(1)
    // 兩個品項都屬於「飲品」分類，加總後應該是 3（2 杯 + 1 杯）。
    expect(body.topCategories).toEqual([{ name: '飲品', count: 3 }])
  })

  it('作廢訂單不計入營收、訂單數與各項排行，跟 shifts.ts 的 sumCashSales 同一套規則', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    await db.insert(categories).values([{ id: 'cat-1', name: '飲品' }])
    await db
      .insert(products)
      .values([
        { id: 'prod-1', categoryId: 'cat-1', name: '楊枝甘露2.0', basePrice: 80, stock: null }
      ])
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    expect(createRes.status).toBe(201)
    const created = await readJson(createRes)

    const voidRes = await app.request(`/api/orders/${created.orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '客訴退單' })
    })
    expect(voidRes.status).toBe(200)

    const res = await app.request('/api/reports/sales?from=20260101&to=20260101', {
      headers: { 'X-Device-Token': deviceToken }
    })
    const body = await readJson(res)

    expect(body.dailyRevenue).toEqual([{ businessDate: '20260101', revenue: 0 }])
    expect(body.orderCount).toBe(0)
    expect(body.topProducts).toEqual([])
    expect(body.topPaymentMethods).toEqual([])
    expect(body.topCategories).toEqual([])
    // 作廢訂單本身仍要算進 voidedOrderCount，不是完全從報表消失、無跡可循。
    expect(body.voidedOrderCount).toBe(1)
  })

  it('折扣總額、退款、內用／外帶佔比都直接來自 D1 聚合，不是前端猜的數字', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    // 外帶、套用 $50 折價券：160 - 50 = 110。
    const takeoutRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB1',
          orderChannel: '外帶',
          appliedCoupon: { type: 'coupon', couponId: 'money-1' },
          tenders: [{ method: '現金', amount: 110 }]
        })
      )
    })
    expect(takeoutRes.status).toBe(201)

    // 內用、無折扣，之後退款 30 元。
    const dineInRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB2', orderChannel: '內用' })
      )
    })
    expect(dineInRes.status).toBe(201)
    const dineInOrder = await readJson(dineInRes)

    const refundRes = await app.request(`/api/orders/${dineInOrder.orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FC1',
        amount: 30,
        reason: '少一顆珍珠',
        operator: '店長 - Lemon'
      })
    })
    expect(refundRes.status).toBe(201)

    const res = await app.request('/api/reports/sales?from=20260101&to=20260101', {
      headers: { 'X-Device-Token': deviceToken }
    })
    const body = await readJson(res)

    expect(body.orderCount).toBe(2)
    expect(body.discountAmount).toBe(50)
    expect(body.refundedOrderCount).toBe(1)
    expect(body.refundAmount).toBe(30)
    expect(body.voidedOrderCount).toBe(0)
    expect(body.channelBreakdown).toEqual(
      expect.arrayContaining([
        { channel: '外帶', count: 1, revenue: 110 },
        { channel: '內用', count: 1, revenue: 160 }
      ])
    )
  })
})
