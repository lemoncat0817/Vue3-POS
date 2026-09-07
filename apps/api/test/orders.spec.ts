import { describe, expect, it } from 'vitest'
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
    businessDate: '20240610',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    payment: '現金',
    appliedCoupon: { type: 'none' },
    ...overrides,
  }
}

describe('POST /api/orders（裝置憑證檢查，見 P4）', () => {
  it('沒有帶裝置憑證標頭時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest()),
    })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/orders', () => {
  it('金額由伺服端用 priceLine() 重算，不信任用戶端送來的數字（用戶端送的請求本來就不含金額）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, ecoDiscount: true }], // 80*2 - 5*2 = 150
        }),
      ),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderData[0].totalPrice).toBe(150)
    expect(body.orderData[0].useDiscountMoney).toBe('環保折扣')
    expect(body.orderTotalPrice).toBe(150)
    expect(body.orderCupCount).toBe(2)
    expect(body.orderId).toBe('202406101')
  })

  it('同一營業日內連續建立訂單，編號依序遞增', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV' })),
    })
    const res2 = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAW' })),
    })
    const body2 = await readJson(res2)
    expect(body2.orderId).toBe('202406102')
  })

  it('多筆訂單同時送出時，每筆都核發到不同的序號（P6：多終端情境，不會撞號）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const idempotencyKeys = [
      '01ARZ3NDEKTSV4RRFFQ69G5FA1',
      '01ARZ3NDEKTSV4RRFFQ69G5FA2',
      '01ARZ3NDEKTSV4RRFFQ69G5FA3',
      '01ARZ3NDEKTSV4RRFFQ69G5FA4',
      '01ARZ3NDEKTSV4RRFFQ69G5FA5',
    ]
    // 用 Promise.all 同時送出——模擬多台終端幾乎同時送單。實測過這裡
    // 用 better-sqlite3 的測試環境不一定能穩定重現舊版「查同一營業日
    // 已有幾筆訂單、+1」的撞號 bug（better-sqlite3 是同步呼叫，這個
    // 測試環境下的 await 交錯時機跟真正兩個獨立網路請求打進 Workers
    // runtime 不完全一樣）；這裡當基本正確性檢查，實際撞號情境已經用
    // wrangler dev 對本機 D1 手動送過真正並發的請求驗證過（見
    // apps/api/README.md）。
    const responses = await Promise.all(
      idempotencyKeys.map((idempotencyKey) =>
        app.request('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
          body: JSON.stringify(buildRequest({ idempotencyKey })),
        }),
      ),
    )

    expect(responses.every((res) => res.status === 201)).toBe(true)
    const bodies = await Promise.all(responses.map((res) => readJson(res)))
    const orderIds = bodies.map((body) => body.orderId)
    expect(new Set(orderIds).size).toBe(idempotencyKeys.length)
  })

  it('重送同一個 idempotencyKey 回傳原本那筆訂單，不會建立第二筆（冪等）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest()),
    })
    const firstBody = await readJson(first)
    expect(first.status).toBe(201)

    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest()),
    })
    const secondBody = await readJson(second)
    expect(second.status).toBe(200)
    expect(secondBody.orderId).toBe(firstBody.orderId)

    const list = await readJson(await app.request('/api/orders'))
    expect(list).toHaveLength(1)
  })

  it('拒絕不合法的請求（Zod 驗證失敗，例如空的品項清單）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ lines: [] })),
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/orders（P5：訂單層級折價券，伺服端重算折抵金額，不信任用戶端）', () => {
  it('套用現金折價券：折抵金額查真正的折價券資料，不是用戶端說了算', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ appliedCoupon: { type: 'money', couponId: 'money-1' } })), // 160 - 50
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderTotalPrice).toBe(160)
    expect(body.orderDiscount).toBe(50)
    expect(body.orderPaymentPrice).toBe(110)
    expect(body.discountName).toBe('$50折價券')
  })

  it('套用折數折價券：以伺服端重算後的訂單小計計算，四捨五入', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ appliedCoupon: { type: 'percent', couponId: 'percent-1' } })), // round(160*0.95)
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderPaymentPrice).toBe(152)
    expect(body.orderDiscount).toBe(8)
    expect(body.discountName).toBe('整單95折')
  })

  it('現金折價券面額超過訂單金額時，應付金額只會到 0，不會是負數', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, count: 1 }], // 80 元
          appliedCoupon: { type: 'money', couponId: 'money-2' }, // 折 100 元
        }),
      ),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderPaymentPrice).toBe(0)
    expect(body.orderDiscount).toBe(80)
  })

  it('套用不存在的折價券時拒絕，回傳 400（不能無中生有一張折價券）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ appliedCoupon: { type: 'money', couponId: 'does-not-exist' } })),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/orders', () => {
  it('沒有訂單時回傳空陣列', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})
