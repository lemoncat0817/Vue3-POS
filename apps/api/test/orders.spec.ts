import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import {
  categories,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  products
} from '../src/db/schema'
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

// validLine（2 杯 80 元）預設應付 160 元，更動 lines 或 coupon 時需同步指定 tenders。
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
    ...overrides
  }
}

describe('POST /api/orders（裝置憑證檢查）', () => {
  it('沒有帶裝置憑證標頭時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest())
    })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/orders', () => {
  it('金額由伺服端用 priceLine() 重算，不信任用戶端送來的數字（用戶端送的請求本來就不含金額）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, quickDiscountId: 'quick-1' }], // 80*2 - 5*2 = 150
          tenders: [{ method: '現金', amount: 150 }]
        })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderData[0].totalPrice).toBe(150)
    expect(body.orderData[0].quickDiscountName).toBe('常客優惠')
    expect(body.orderTotalPrice).toBe(150)
    expect(body.orderCupCount).toBe(2)
    expect(body.orderId).toBe('202406101')
  })

  it('orderChannel 原封不動存回並回傳', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ orderChannel: '內用' }))
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderChannel).toBe('內用')

    const list = await readJson(await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } }))
    expect(
      list.items.find((o: { orderId: string }) => o.orderId === body.orderId).orderChannel
    ).toBe('內用')
  })

  it('內用桌號原封不動存回並回傳，純紀錄用途', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ orderChannel: '內用', tableNumber: 'A1' }))
    })
    expect(res.status).toBe(201)
    expect((await readJson(res)).tableNumber).toBe('A1')
  })

  it('沒有帶桌號時，tableNumber 是 null', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    expect(res.status).toBe(201)
    expect((await readJson(res)).tableNumber).toBeNull()
  })

  it('備註原封不動存回並回傳，前後空白會被修剪', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ note: '  外送地址：忠孝東路一段1號  ' }))
    })
    expect(res.status).toBe(201)
    expect((await readJson(res)).note).toBe('外送地址：忠孝東路一段1號')
  })

  it('沒有帶備註、或備註只有空白時，note 是 null', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const noNote = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    expect((await readJson(noNote)).note).toBeNull()

    // 不同 idempotencyKey，避免命中上一筆的冪等快取而沒有真的測到這次的備註。
    const blankNote = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FBV', note: '   ' })
      )
    })
    expect((await readJson(blankNote)).note).toBeNull()
  })

  it('沒有帶 orderChannel 時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const withoutChannel: Record<string, unknown> = buildRequest()
    delete withoutChannel.orderChannel
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(withoutChannel)
    })
    expect(res.status).toBe(400)
  })

  it('每一筆訂單都會核發發票號碼，連續建立的訂單編號依序遞增', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB1' }))
    })
    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB2' }))
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
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ invoiceCarrier: { type: '手機條碼', value: '/ABC1234' } })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.invoiceCarrier).toEqual({ type: '手機條碼', value: '/ABC1234' })

    const invalid = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FC1',
          invoiceCarrier: { type: '手機條碼', value: 'bad' }
        })
      )
    })
    expect(invalid.status).toBe(400)
  })

  it('帶統一編號載具時原封不動存回並回傳（B2B 情境）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ invoiceCarrier: { type: '統一編號', value: '12345678' } })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.invoiceCarrier).toEqual({ type: '統一編號', value: '12345678' })
  })

  it('同一營業日內連續建立訂單，編號依序遞增', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }))
    })
    const res2 = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAW' }))
    })
    const body2 = await readJson(res2)
    expect(body2.orderId).toBe('202406102')
  })

  it('多筆訂單同時送出時，每筆都核發到不同的序號', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const idempotencyKeys = [
      '01ARZ3NDEKTSV4RRFFQ69G5FA1',
      '01ARZ3NDEKTSV4RRFFQ69G5FA2',
      '01ARZ3NDEKTSV4RRFFQ69G5FA3',
      '01ARZ3NDEKTSV4RRFFQ69G5FA4',
      '01ARZ3NDEKTSV4RRFFQ69G5FA5'
    ]
    const responses = await Promise.all(
      idempotencyKeys.map((idempotencyKey) =>
        app.request('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Token': deviceToken,
            'X-Operator-Session': sessionToken
          },
          body: JSON.stringify(buildRequest({ idempotencyKey }))
        })
      )
    )

    expect(responses.every((res) => res.status === 201)).toBe(true)
    const bodies = await Promise.all(responses.map((res) => readJson(res)))
    const orderIds = bodies.map((body) => body.orderId)
    expect(new Set(orderIds).size).toBe(idempotencyKeys.length)
  })

  it('重送同一個 idempotencyKey 回傳原本那筆訂單，不會建立第二筆（冪等）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    const firstBody = await readJson(first)
    expect(first.status).toBe(201)

    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    const secondBody = await readJson(second)
    expect(second.status).toBe(200)
    expect(secondBody.orderId).toBe(firstBody.orderId)

    const list = await readJson(await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } }))
    expect(list.items).toHaveLength(1)
  })

  it('lines 是空陣列時回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ lines: [] }))
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/orders（送單成功後扣庫存）', () => {
  it('品項與加購選項的庫存不是 null 時，送單成功後依數量扣減，扣到 0 就不再往下扣', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    await db.insert(categories).values([{ id: 'c1', name: '季節限定' }])
    await db
      .insert(products)
      .values([{ id: 'i1', categoryId: 'c1', name: '楊枝甘露2.0', basePrice: 80, stock: 3 }])
    await db
      .insert(modifierGroups)
      .values([{ id: 'mg1', name: '加料', selectionType: 'multiple', required: false }])
    await db
      .insert(modifierOptions)
      .values([{ id: 'a1', groupId: 'mg1', name: '珍珠', priceDelta: 10, stock: 1 }])
    // 珍珠掛在 i1 上，加購名稱才會通過合法性檢查（見 findIllegalAddOns）。
    await db.insert(productModifierGroups).values([{ productId: 'i1', groupId: 'mg1' }])

    // 扣庫存至 0 為下限，不為負數。
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, addList: ['珍珠'], addListPrice: 10 }],
          tenders: [{ method: '現金', amount: 180 }]
        })
      )
    })
    expect(res.status).toBe(201)

    const item = await db.select().from(products).where(eq(products.id, 'i1')).get()
    const addOn = await db.select().from(modifierOptions).where(eq(modifierOptions.id, 'a1')).get()
    expect(item?.stock).toBe(1)
    expect(addOn?.stock).toBe(0)
  })

  it('加購選項沒有掛在這個品項上時，送單拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    await db.insert(categories).values([{ id: 'c1', name: '主餐' }, { id: 'c2', name: '飲品' }])
    await db.insert(products).values([
      { id: 'i1', categoryId: 'c1', name: '招牌牛肉漢堡', basePrice: 180, stock: null },
      { id: 'i2', categoryId: 'c2', name: '翡翠綠茶', basePrice: 30, stock: null }
    ])
    await db
      .insert(modifierGroups)
      .values([{ id: 'mg1', name: '加料', selectionType: 'multiple', required: false }])
    await db
      .insert(modifierOptions)
      .values([{ id: 'mo1', groupId: 'mg1', name: '珍珠', priceDelta: 10, stock: null }])
    // 珍珠只掛在飲品（i2）上，不掛漢堡（i1）——對應本次要修的問題情境。
    await db.insert(productModifierGroups).values([{ productId: 'i2', groupId: 'mg1' }])

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [
            {
              ...validLine,
              name: '招牌牛肉漢堡',
              price: 180,
              count: 1,
              addList: ['珍珠'],
              addListPrice: 10
            }
          ],
          tenders: [{ method: '現金', amount: 190 }]
        })
      )
    })
    expect(res.status).toBe(400)
    const body = await readJson(res)
    expect(body.error).toContain('珍珠')
  })

  it('庫存是 null（不追蹤）或找不到對應品項時，送單成功但不影響庫存', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    await db.insert(categories).values([{ id: 'c1', name: '季節限定' }])
    await db
      .insert(products)
      .values([{ id: 'i1', categoryId: 'c1', name: '楊枝甘露2.0', basePrice: 80, stock: null }])

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest())
    })
    expect(res.status).toBe(201)

    const item = await db.select().from(products).where(eq(products.id, 'i1')).get()
    expect(item?.stock).toBeNull()
  })

  it('重送同一筆訂單（idempotencyKey 命中）不會扣兩次庫存', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    await db.insert(categories).values([{ id: 'c1', name: '季節限定' }])
    await db
      .insert(products)
      .values([{ id: 'i1', categoryId: 'c1', name: '楊枝甘露2.0', basePrice: 80, stock: 10 }])

    const body = JSON.stringify(buildRequest())
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body
    })
    expect(first.status).toBe(201)
    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body
    })
    expect(second.status).toBe(200)

    // validLine 是 2 杯，只應該扣一次（10 - 2 = 8），不是兩次。
    const item = await db.select().from(products).where(eq(products.id, 'i1')).get()
    expect(item?.stock).toBe(8)
  })
})

describe('POST /api/orders（訂單層級折價券，伺服端重算折抵金額）', () => {
  it('套用現金折價券：折抵金額查真正的折價券資料，不是用戶端說了算', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          appliedCoupon: { type: 'coupon', couponId: 'money-1' }, // 160 - 50
          tenders: [{ method: '現金', amount: 110 }]
        })
      )
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
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          appliedCoupon: { type: 'coupon', couponId: 'percent-1' }, // round(160*0.95)
          tenders: [{ method: '現金', amount: 152 }]
        })
      )
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
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, count: 1 }], // 80 元
          appliedCoupon: { type: 'coupon', couponId: 'money-2' }, // 折 100 元
          tenders: [{ method: '現金', amount: 0 }]
        })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderPaymentPrice).toBe(0)
    expect(body.orderDiscount).toBe(80)
  })

  it('套用不存在的折價券時拒絕，回傳 400（不能無中生有一張折價券）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ appliedCoupon: { type: 'coupon', couponId: 'does-not-exist' } })
      )
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/orders', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders')
    expect(res.status).toBe(401)
  })

  it('沒有訂單時回傳空清單，分頁統計也是 0', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      items: [],
      pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 1 }
    })
  })

  it('預設依訂單時間新到舊排序，page/pageSize 正確分頁', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const idempotencyKeys = [
      '01ARZ3NDEKTSV4RRFFQ69G5FA1',
      '01ARZ3NDEKTSV4RRFFQ69G5FA2',
      '01ARZ3NDEKTSV4RRFFQ69G5FA3'
    ]
    const orderIds: string[] = []
    for (const idempotencyKey of idempotencyKeys) {
      const res = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify(buildRequest({ idempotencyKey }))
      })
      orderIds.push((await readJson(res)).orderId)
    }

    const firstPage = await readJson(
      await app.request('/api/orders?page=1&pageSize=2', { headers: { 'X-Device-Token': deviceToken } })
    )
    expect(firstPage.pagination).toEqual({
      page: 1,
      pageSize: 2,
      totalCount: 3,
      totalPages: 2
    })
    expect(firstPage.items.map((o: { orderId: string }) => o.orderId)).toEqual(
      [orderIds[2], orderIds[1]]
    )

    const secondPage = await readJson(
      await app.request('/api/orders?page=2&pageSize=2', { headers: { 'X-Device-Token': deviceToken } })
    )
    expect(secondPage.items.map((o: { orderId: string }) => o.orderId)).toEqual([orderIds[0]])
  })

  it('依訂單狀態、通路、服務人員、付款方式、關鍵字篩選', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const dineIn = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB1',
          orderChannel: '內用',
          tenders: [{ method: '信用卡', amount: 160 }]
        })
      )
    })
    const dineInId = (await readJson(dineIn)).orderId
    await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB2',
          orderChannel: '外帶',
          tenders: [{ method: '現金', amount: 160 }]
        })
      )
    })

    const byChannel = await readJson(await app.request('/api/orders?channel=內用', { headers: { 'X-Device-Token': deviceToken } }))
    expect(byChannel.items.map((o: { orderId: string }) => o.orderId)).toEqual([dineInId])

    const byPayMethod = await readJson(await app.request('/api/orders?payMethod=信用卡', { headers: { 'X-Device-Token': deviceToken } }))
    expect(byPayMethod.items.map((o: { orderId: string }) => o.orderId)).toEqual([dineInId])

    const byKeyword = await readJson(
      await app.request(`/api/orders?keyword=${dineInId}`, {
        headers: { 'X-Device-Token': deviceToken }
      })
    )
    expect(byKeyword.items.map((o: { orderId: string }) => o.orderId)).toEqual([dineInId])

    await app.request(`/api/orders/${dineInId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試' })
    })
    const byStatus = await readJson(await app.request('/api/orders?status=已取消', { headers: { 'X-Device-Token': deviceToken } }))
    expect(byStatus.items.map((o: { orderId: string }) => o.orderId)).toEqual([dineInId])
  })
})

describe('GET /api/orders/summary', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders/summary')
    expect(res.status).toBe(401)
  })

  it('沒有訂單時全部是 0，服務人員名單是空陣列', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/orders/summary', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      totalCount: 0,
      totalRevenue: 0,
      completedCount: 0,
      voidCount: 0,
      refundCount: 0,
      staffNames: []
    })
  })

  it('營收淨額只計入已完成訂單，並扣除已完成訂單的退款；作廢訂單不影響營收', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const completed = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FC1' }))
    })
    const completedId = (await readJson(completed)).orderId
    await app.request(`/api/orders/${completedId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: 60,
        reason: '少一杯',
        operator: '店長 - Lemon'
      })
    })

    const voided = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FC2' }))
    })
    const voidedId = (await readJson(voided)).orderId
    await app.request(`/api/orders/${voidedId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試' })
    })

    const summary = await readJson(await app.request('/api/orders/summary', { headers: { 'X-Device-Token': deviceToken } }))
    expect(summary.totalCount).toBe(2)
    expect(summary.completedCount).toBe(1)
    expect(summary.voidCount).toBe(1)
    expect(summary.refundCount).toBe(1)
    // 已完成訂單應付 160，退款 60 → 淨營收 100；作廢訂單的 160 不計入。
    expect(summary.totalRevenue).toBe(100)
    expect(summary.staffNames).toEqual(['店長 - Lemon'])
  })
})

describe('POST /api/orders（混合支付）', () => {
  it('單一 tender 剛好付清：changeDue 為 0，orderPayment 是該方式的名稱', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ tenders: [{ method: '信用卡', amount: 160 }] }))
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
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({ tenders: [{ method: '現金', amount: 160, receivedAmount: 500 }] })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.tenders).toEqual([{ method: '現金', amount: 160, receivedAmount: 500 }])
    expect(body.changeDue).toBe(340)
  })

  it('多筆混合支付：現金找零 + 信用卡各分擔一部分，摘要用頓號連接', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          tenders: [
            { method: '現金', amount: 60, receivedAmount: 100 },
            { method: '信用卡', amount: 100 }
          ]
        })
      )
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.tenders).toEqual([
      { method: '現金', amount: 60, receivedAmount: 100 },
      { method: '信用卡', amount: 100 }
    ])
    expect(body.changeDue).toBe(40)
    expect(body.orderPayment).toBe('現金、信用卡')
  })

  it('tenders 金額總和跟應付金額不符時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(buildRequest({ tenders: [{ method: '現金', amount: 100 }] })) // 應付 160
    })
    expect(res.status).toBe(400)
    const body = await readJson(res)
    expect(body.error).toContain('付款金額總和')
  })

  it('折抵到 0 元的訂單仍可用單一 amount:0 的 tender 結案', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(
        buildRequest({
          lines: [{ ...validLine, count: 1 }], // 80 元
          appliedCoupon: { type: 'coupon', couponId: 'money-2' }, // 折 100 元 → 應付 0
          tenders: [{ method: '現金', amount: 0 }]
        })
      )
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
  sessionToken: string
): Promise<string> {
  const res = await app.request('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    },
    body: JSON.stringify(buildRequest())
  })
  const body = await readJson(res)
  return body.orderId
}

describe('PATCH /api/orders/:orderId/status', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderStatus: '已取消',
        operator: '店長 - Lemon',
        reason: '顧客取消訂單'
      })
    })
    expect(res.status).toBe(401)
  })

  it('更新存在的訂單狀態，之後 GET 也看得到新狀態', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        orderStatus: '已取消',
        operator: '店長 - Lemon',
        reason: '顧客取消訂單'
      })
    })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.orderStatus).toBe('已取消')
    expect(body.voidReason).toBe('顧客取消訂單')
    expect(body.voidedBy).toBe('店長 - Lemon')
    expect(body.voidedAt).toEqual(expect.any(String))

    const list = await readJson(await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } }))
    expect(list.items.find((o: { orderId: string }) => o.orderId === orderId).orderStatus).toBe('已取消')
  })

  it('作廢一筆訂單後又改回已完成，撤銷作廢，voidReason 等欄位清空', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '按錯了' })
    })
    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已完成', operator: '店長 - Lemon' })
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
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(400)
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試' })
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/orders/:orderId/refunds（退款／作廢）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: 10,
        reason: '顧客不滿意',
        operator: '店長 - Lemon'
      })
    })
    expect(res.status).toBe(401)
  })

  it('退部分金額成功，refundedAmount／refunds 反映在訂單上，訂單狀態仍是已完成', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)
    const created = await readJson(
      await app.request(`/api/orders`, {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    const order = created.items.find((o: { orderId: string }) => o.orderId === orderId)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: 50,
        reason: '少一杯',
        operator: '店長 - Lemon'
      })
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.orderStatus).toBe('已完成')
    expect(body.refundedAmount).toBe(50)
    expect(body.refunds).toHaveLength(1)
    expect(body.refunds[0]).toMatchObject({
      amount: 50,
      reason: '少一杯',
      operator: '店長 - Lemon'
    })
    expect(body.refundedAmount).toBeLessThanOrEqual(order.orderPaymentPrice)
  })

  it('同一個 refundId 重送是冪等的，不會建立第二筆退款', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)
    const refundPayload = {
      refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      amount: 50,
      reason: '少一杯',
      operator: '店長 - Lemon'
    }

    const first = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(refundPayload)
    })
    expect(first.status).toBe(201)

    const second = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify(refundPayload)
    })
    expect(second.status).toBe(200)
    const body = await readJson(second)
    expect(body.refunds).toHaveLength(1)
    expect(body.refundedAmount).toBe(50)
  })

  it('退款金額超過還能退的額度時拒絕，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)
    const created = await readJson(
      await app.request(`/api/orders`, {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    const order = created.items.find((o: { orderId: string }) => o.orderId === orderId)

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: order.orderPaymentPrice + 1,
        reason: '超額測試',
        operator: '店長 - Lemon'
      })
    })
    expect(res.status).toBe(400)
  })

  it('已作廢的訂單不能再退款，回傳 400', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    await app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '整單作廢' })
    })

    const res = await app.request(`/api/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: 10,
        reason: '不應該成功',
        operator: '店長 - Lemon'
      })
    })
    expect(res.status).toBe(400)
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        amount: 10,
        reason: '測試',
        operator: '店長 - Lemon'
      })
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/orders/:orderId', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('刪除存在的訂單，連明細一起消失，之後 GET 也看不到', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const orderId = await createOne(app, deviceToken, sessionToken)

    const res = await app.request(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(204)

    const list = await readJson(await app.request('/api/orders', { headers: { 'X-Device-Token': deviceToken } }))
    expect(list.items.find((o: { orderId: string }) => o.orderId === orderId)).toBeUndefined()
  })

  it('訂單不存在時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/orders/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(404)
  })
})
