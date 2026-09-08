import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
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
  count: 2,
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
    businessDate: '20260101',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    tenders: [{ method: '現金', amount: 160 }],
    appliedCoupon: { type: 'none' },
    orderChannel: '外帶',
    ...overrides,
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
  it('不需要裝置憑證即可查詢（唯讀報表，跟 GET /api/catalog、GET /api/promotions 同一套慣例）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260101&to=20260101')
    expect(res.status).toBe(200)
  })

  it('from 晚於 to 時回傳 400', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260107&to=20260101')
    expect(res.status).toBe(400)
  })

  it('dailyRevenue 涵蓋查詢範圍內每一天，沒有訂單的日子是 0，不是缺漏', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/reports/sales?from=20260101&to=20260103')
    const body = await readJson(res)
    expect(body.dailyRevenue).toEqual([
      { businessDate: '20260101', revenue: 0 },
      { businessDate: '20260102', revenue: 0 },
      { businessDate: '20260103', revenue: 0 },
    ])
  })

  it('營業額、小時分桶、熱銷飲料／配料／付款方式都直接來自 D1 的聚合結果，不是用戶端算好回傳的數字', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    // 兩杯楊枝甘露（無配料）+ 一杯有加珍珠、椰果的飲料，同一張訂單。
    const createRes = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          lines: [
            validLine,
            { ...validLine, name: '珍珠奶茶', count: 1, addList: ['珍珠', '椰果'] },
          ],
          tenders: [{ method: '現金', amount: 240 }], // 160 + 80
        }),
      ),
    })
    expect(createRes.status).toBe(201)
    const created = await readJson(createRes)

    const res = await app.request('/api/reports/sales?from=20260101&to=20260101')
    expect(res.status).toBe(200)
    const body = await readJson(res)

    expect(body.dailyRevenue).toEqual([{ businessDate: '20260101', revenue: created.orderPaymentPrice }])

    const hourTen = body.hourlyRevenue.find((point: { hour: number }) => point.hour === 10)
    expect(hourTen.revenue).toBe(created.orderPaymentPrice)
    const otherHours = body.hourlyRevenue.filter((point: { hour: number }) => point.hour !== 10)
    expect(otherHours.every((point: { revenue: number }) => point.revenue === 0)).toBe(true)

    expect(body.topDrinks).toEqual(
      expect.arrayContaining([
        { name: '楊枝甘露2.0', count: 2 },
        { name: '珍珠奶茶', count: 1 },
      ]),
    )
    // '無添加配料' 那兩杯不該出現在配料排行——json_type 過濾掉非陣列的 addList。
    expect(body.topAddOns).toEqual(
      expect.arrayContaining([
        { name: '珍珠', count: 1 },
        { name: '椰果', count: 1 },
      ]),
    )
    expect(body.topAddOns).toHaveLength(2)
    expect(body.topPaymentMethods).toEqual([{ name: '現金', count: 1 }])
  })
})
