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

function buildOrderRequest(idempotencyKey: string, tenders: { method: string; amount: number }[]) {
  return {
    idempotencyKey,
    businessDate: '20260101',
    staff: '店長 - Lemon',
    lines: [validLine],
    bagCount: 0,
    tenders,
    appliedCoupon: { type: 'none' },
  }
}

describe('POST /api/shifts（P6：規劃書 §10 P0「班別結帳」）', () => {
  it('沒有帶裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    expect(res.status).toBe(401)
  })

  it('開帳成功，回傳 status open，數字類欄位在收班前都是 null', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({
      status: 'open',
      openedBy: '店長 - Lemon',
      openingFloat: 3000,
      cashSales: null,
      expectedCash: null,
      actualCash: null,
      variance: null,
      movements: [],
    })
  })

  it('同一個 shiftId 重送回傳原本那筆（冪等），不會建立第二筆', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const body = { shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }
    const first = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(body),
    })
    expect(first.status).toBe(201)

    const second = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(body),
    })
    expect(second.status).toBe(200)
    const firstBody = await readJson(first)
    const secondBody = await readJson(second)
    expect(secondBody.id).toBe(firstBody.id)
  })

  it('已經有一筆班別開帳中時，再開新的班別拒絕，回傳 409', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FA1', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    const res = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FA2', operator: '值班經理', openingFloat: 3000 }),
    })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/shifts/current', () => {
  it('沒有開帳中的班別時回傳 404', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/shifts/current')
    expect(res.status).toBe(404)
  })

  it('有開帳中的班別時回傳該筆', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    const res = await app.request('/api/shifts/current')
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.status).toBe('open')
  })
})

describe('POST /api/shifts/:id/cash-movements', () => {
  it('找不到班別時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/shifts/does-not-exist/cash-movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ type: 'in', amount: 1000, reason: '追加零錢', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(404)
  })

  it('記錄中途存入／提出，回傳的 cashIn／cashOut 正確加總', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const openRes = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    const shiftId = (await readJson(openRes)).id

    await app.request(`/api/shifts/${shiftId}/cash-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ type: 'in', amount: 1000, reason: '追加零錢', operator: '店長 - Lemon' }),
    })
    const res = await app.request(`/api/shifts/${shiftId}/cash-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ type: 'out', amount: 400, reason: '存入保險箱', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body.cashIn).toBe(1000)
    expect(body.cashOut).toBe(400)
    expect(body.movements).toHaveLength(2)
  })

  it('班別已收班時拒絕記錄現金異動，回傳 409', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const openRes = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    const shiftId = (await readJson(openRes)).id
    await app.request(`/api/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3000 }),
    })

    const res = await app.request(`/api/shifts/${shiftId}/cash-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ type: 'in', amount: 100, reason: '測試', operator: '店長 - Lemon' }),
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/shifts/:id/close', () => {
  it('收班時把班別期間的現金訂單算進 cashSales，非現金訂單不計入，帳差為 0（點鈔剛好對得起來）', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const openRes = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    expect(openRes.status).toBe(201)

    // 一筆現金訂單（80 元）、一筆信用卡訂單（80 元）——只有現金那筆該算進 cashSales。
    await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildOrderRequest('01ARZ3NDEKTSV4RRFFQ69G5FB1', [{ method: '現金', amount: 80 }])),
    })
    await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(buildOrderRequest('01ARZ3NDEKTSV4RRFFQ69G5FB2', [{ method: '信用卡', amount: 80 }])),
    })

    // 中途存入 500 現金（例如追加零錢準備金）。
    await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/cash-movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ type: 'in', amount: 500, reason: '追加零錢', operator: '店長 - Lemon' }),
    })

    // 應有現金 = 3000（開帳）+ 80（現金訂單）+ 500（存入）= 3580。
    const closeRes = await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3580 }),
    })
    expect(closeRes.status).toBe(200)
    const body = await readJson(closeRes)
    expect(body.status).toBe('closed')
    expect(body.cashSales).toBe(80)
    expect(body.expectedCash).toBe(3580)
    expect(body.actualCash).toBe(3580)
    expect(body.variance).toBe(0)
  })

  it('實際點鈔少於應有現金時，variance 為負數（短少）', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    const res = await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 2900 }),
    })
    const body = await readJson(res)
    expect(body.expectedCash).toBe(3000)
    expect(body.variance).toBe(-100)
  })

  it('已經收班的班別再次收班拒絕，回傳 409', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3000 }),
    })
    const res = await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3000 }),
    })
    expect(res.status).toBe(409)
  })

  it('收班後可以再開一筆新的班別（上一筆已經是 closed，不再擋開帳）', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FA1', operator: '店長 - Lemon', openingFloat: 3000 }),
    })
    await app.request('/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FA1/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3000 }),
    })
    const res = await app.request('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FA2', operator: '值班經理', openingFloat: 2000 }),
    })
    expect(res.status).toBe(201)
  })
})
