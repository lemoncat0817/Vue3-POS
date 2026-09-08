import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { addOnOptions, catalogGroups, catalogItems } from '../src/db/schema'
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

// 預設品項（validLine，2 杯 80 元）在沒有任何折扣／折價券時應付 160 元
// ——buildRequest() 沒有另外指定 tenders 的測試都假設這個金額，改動
// lines 或 appliedCoupon 而不跟著調整 tenders 的測試，見各自呼叫處
// 另外指定的 tenders override。
function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    businessDate: '20240610',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    tenders: [{ method: '現金', amount: 160 }],
    appliedCoupon: { type: 'none' },
    orderChannel: '外帶',
    invoiceCarrier: { type: '無載具' },
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
          tenders: [{ method: '現金', amount: 150 }],
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

  it('orderChannel 原封不動存回並回傳（P13：規劃書 §10 P0「內用外帶」）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ orderChannel: '內用' })),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderChannel).toBe('內用')

    const list = await readJson(await app.request('/api/orders'))
    expect(list.find((o: { orderId: string }) => o.orderId === body.orderId).orderChannel).toBe('內用')
  })

  it('內用桌號原封不動存回並回傳，純紀錄用途（P24：規劃書 §10 P24「真實硬體整合與桌況管理」）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ orderChannel: '內用', tableNumber: 'A1' })),
    })
    expect(res.status).toBe(201)
    expect((await readJson(res)).tableNumber).toBe('A1')
  })

  it('沒有帶桌號時，tableNumber 是 null', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest()),
    })
    expect(res.status).toBe(201)
    expect((await readJson(res)).tableNumber).toBeNull()
  })

  it('沒有帶 orderChannel 時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const withoutChannel: Record<string, unknown> = buildRequest()
    delete withoutChannel.orderChannel
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(withoutChannel),
    })
    expect(res.status).toBe(400)
  })

  it('每一筆訂單都會核發發票號碼，連續建立的訂單編號依序遞增（P15：規劃書 §10 P0「發票」）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB1' })),
    })
    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB2' })),
    })
    const firstBody = await readJson(first)
    const secondBody = await readJson(second)
    expect(firstBody.invoiceNumber).toMatch(/^AA\d{8}$/)
    expect(secondBody.invoiceNumber).toMatch(/^AA\d{8}$/)
    expect(secondBody.invoiceNumber).not.toBe(firstBody.invoiceNumber)
  })

  it('帶手機條碼載具時原封不動存回並回傳，格式不對時拒絕（回傳 400）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ invoiceCarrier: { type: '手機條碼', value: '/ABC1234' } })),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.invoiceCarrier).toEqual({ type: '手機條碼', value: '/ABC1234' })

    const invalid = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FC1', invoiceCarrier: { type: '手機條碼', value: 'bad' } })),
    })
    expect(invalid.status).toBe(400)
  })

  it('帶統一編號載具時原封不動存回並回傳（B2B 情境）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ invoiceCarrier: { type: '統一編號', value: '12345678' } })),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.invoiceCarrier).toEqual({ type: '統一編號', value: '12345678' })
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

describe('POST /api/orders（P20：規劃書 §10 P20「基礎庫存管理」，送單成功後扣庫存）', () => {
  it('品項與配料的庫存不是 null 時，送單成功後依數量扣減，扣到 0 就不再往下扣', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    await db.insert(catalogGroups).values([{ id: 'g1', name: '季節限定', type: 'drinkSeasonal' }])
    await db.insert(catalogItems).values([
      { id: 'i1', groupId: 'g1', name: '楊枝甘露2.0', priceL: 80, priceBottle: null, customized: 'none', stock: 3 },
    ])
    await db.insert(addOnOptions).values([{ id: 'a1', name: '珍珠', price: 10, stock: 1 }])

    // 一次送 2 杯，帶 1 份珍珠——品項庫存 3 扣到 1，配料庫存 1（只夠
    // 1 份，扣 2 份）floor 在 0，不會變負數。
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, addList: ['珍珠'], addListPrice: 10 }],
          // validLine 是 2 杯 80 元＋每杯 10 元的配料＝180 元。
          tenders: [{ method: '現金', amount: 180 }],
        }),
      ),
    })
    expect(res.status).toBe(201)

    const item = await db.select().from(catalogItems).where(eq(catalogItems.id, 'i1')).get()
    const addOn = await db.select().from(addOnOptions).where(eq(addOnOptions.id, 'a1')).get()
    expect(item?.stock).toBe(1)
    expect(addOn?.stock).toBe(0)
  })

  it('庫存是 null（不追蹤）或找不到對應品項時，送單成功但不影響庫存', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    await db.insert(catalogGroups).values([{ id: 'g1', name: '季節限定', type: 'drinkSeasonal' }])
    await db.insert(catalogItems).values([
      { id: 'i1', groupId: 'g1', name: '楊枝甘露2.0', priceL: 80, priceBottle: null, customized: 'none', stock: null },
    ])

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest()),
    })
    expect(res.status).toBe(201)

    const item = await db.select().from(catalogItems).where(eq(catalogItems.id, 'i1')).get()
    expect(item?.stock).toBeNull()
  })

  it('重送同一筆訂單（idempotencyKey 命中）不會扣兩次庫存', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    await db.insert(catalogGroups).values([{ id: 'g1', name: '季節限定', type: 'drinkSeasonal' }])
    await db.insert(catalogItems).values([
      { id: 'i1', groupId: 'g1', name: '楊枝甘露2.0', priceL: 80, priceBottle: null, customized: 'none', stock: 10 },
    ])

    const body = JSON.stringify(buildRequest())
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body,
    })
    expect(first.status).toBe(201)
    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body,
    })
    expect(second.status).toBe(200)

    // validLine 是 2 杯，只應該扣一次（10 - 2 = 8），不是兩次。
    const item = await db.select().from(catalogItems).where(eq(catalogItems.id, 'i1')).get()
    expect(item?.stock).toBe(8)
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
      body: JSON.stringify(
        buildRequest({
          appliedCoupon: { type: 'money', couponId: 'money-1' }, // 160 - 50
          tenders: [{ method: '現金', amount: 110 }],
        }),
      ),
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
      body: JSON.stringify(
        buildRequest({
          appliedCoupon: { type: 'percent', couponId: 'percent-1' }, // round(160*0.95)
          tenders: [{ method: '現金', amount: 152 }],
        }),
      ),
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
          tenders: [{ method: '現金', amount: 0 }],
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

describe('POST /api/orders（P6：混合支付，見 @pos/contract 的 tenderInputSchema 說明）', () => {
  it('單一 tender 剛好付清：changeDue 為 0，orderPayment 是該方式的名稱', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ tenders: [{ method: '信用卡', amount: 160 }] })),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.tenders).toEqual([{ method: '信用卡', amount: 160 }])
    expect(body.changeDue).toBe(0)
    expect(body.orderPayment).toBe('信用卡')
  })

  it('現金 tender 帶 receivedAmount：伺服端算出找零，不信任用戶端', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ tenders: [{ method: '現金', amount: 160, receivedAmount: 500 }] })),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.tenders).toEqual([{ method: '現金', amount: 160, receivedAmount: 500 }])
    expect(body.changeDue).toBe(340)
  })

  it('多筆混合支付：現金找零 + 信用卡各分擔一部分，摘要用頓號連接', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          tenders: [
            { method: '現金', amount: 60, receivedAmount: 100 },
            { method: '信用卡', amount: 100 },
          ],
        }),
      ),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.tenders).toEqual([
      { method: '現金', amount: 60, receivedAmount: 100 },
      { method: '信用卡', amount: 100 },
    ])
    expect(body.changeDue).toBe(40)
    expect(body.orderPayment).toBe('現金、信用卡')
  })

  it('tenders 金額總和跟應付金額不符時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildRequest({ tenders: [{ method: '現金', amount: 100 }] })), // 應付 160
    })
    expect(res.status).toBe(400)
    const body = await readJson(res)
    expect(body.error).toContain('付款金額總和')
  })

  it('折抵到 0 元的訂單仍可用單一 amount:0 的 tender 結案', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, count: 1 }], // 80 元
          appliedCoupon: { type: 'money', couponId: 'money-2' }, // 折 100 元 → 應付 0
          tenders: [{ method: '現金', amount: 0 }],
        }),
      ),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderPaymentPrice).toBe(0)
    expect(body.tenders).toEqual([{ method: '現金', amount: 0 }])
    expect(body.changeDue).toBe(0)
  })
})

async function createOne(
  app: Awaited<ReturnType<typeof createTestAppWithDevice>>['app'],
  deviceToken: string,
): Promise<string> {
  const res = await app.request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
    body: JSON.stringify(buildRequest()),
  })
  const body = await readJson(res)
  return body.orderId
}

describe('PATCH /api/orders/:orderId/status（P6：多終端情境，取代 apps/pos 舊版只改本機狀態的做法）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '顧客取消訂單' }),
    })
    expect(res.status).toBe(401)
  })

  it('更新存在的訂單狀態，之後 GET 也看得到新狀態', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '顧客取消訂單' }),
    })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.orderStatus).toBe('已取消')
    expect(body.voidReason).toBe('顧客取消訂單')
    expect(body.voidedBy).toBe('店長 - Lemon')
    expect(body.voidedAt).toEqual(expect.any(String))

    const list = await readJson(await app.request('/api/orders'))
    expect(list.find((o: { orderId: string }) => o.orderId === orderId).orderStatus).toBe('已取消')
  })

  it('作廢一筆訂單後又改回已完成，撤銷作廢，voidReason 等欄位清空', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '按錯了' }),
    })
    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已完成', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.orderStatus).toBe('已完成')
    expect(body.voidReason).toBeNull()
    expect(body.voidedBy).toBeNull()
    expect(body.voidedAt).toBeNull()
  })

  it('作廢訂單沒有填寫原因時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(400)
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/orders/:orderId/refunds（P12：規劃書 §10 P0「退款／作廢」）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', amount: 10, reason: '顧客不滿意', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(401)
  })

  it('退部分金額成功，refundedAmount／refunds 反映在訂單上，訂單狀態仍是已完成', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)
    const created = await readJson(await app.request(`/api/orders`, { headers: { 'X-Device-Token': deviceToken } }))
    const order = created.find((o: { orderId: string }) => o.orderId === orderId)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', amount: 50, reason: '少一杯', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderStatus).toBe('已完成')
    expect(body.refundedAmount).toBe(50)
    expect(body.refunds).toHaveLength(1)
    expect(body.refunds[0]).toMatchObject({ amount: 50, reason: '少一杯', operator: '店長 - Lemon' })
    expect(body.refundedAmount).toBeLessThanOrEqual(order.orderPaymentPrice)
  })

  it('同一個 refundId 重送是冪等的，不會建立第二筆退款', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)
    const refundPayload = { refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', amount: 50, reason: '少一杯', operator: '店長 - Lemon' }

    const first = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(refundPayload),
    })
    expect(first.status).toBe(201)

    const second = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(refundPayload),
    })
    expect(second.status).toBe(200)
    const body = await readJson(second)
    expect(body.refunds).toHaveLength(1)
    expect(body.refundedAmount).toBe(50)
  })

  it('退款金額超過還能退的額度時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)
    const created = await readJson(await app.request(`/api/orders`, { headers: { 'X-Device-Token': deviceToken } }))
    const order = created.find((o: { orderId: string }) => o.orderId === orderId)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: order.orderPaymentPrice + 1,
        reason: '超額測試',
        operator: '店長 - Lemon',
      }),
    })
    expect(res.status).toBe(400)
  })

  it('已作廢的訂單不能再退款，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '整單作廢' }),
    })

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', amount: 10, reason: '不應該成功', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(400)
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', amount: 10, reason: '測試', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/orders/:orderId（P6：多終端情境，取代 apps/pos 舊版只改本機狀態的做法）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('刪除存在的訂單，連明細一起消失，之後 GET 也看不到', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken)

    const res = await app.request(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(204)

    const list = await readJson(await app.request('/api/orders'))
    expect(list.find((o: { orderId: string }) => o.orderId === orderId)).toBeUndefined()
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })
})
