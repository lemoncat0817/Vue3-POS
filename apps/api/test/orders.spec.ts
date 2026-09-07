import { describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb } from './helpers/db'

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
    orderDiscount: 0,
    discountName: '無',
    ...overrides,
  }
}

describe('POST /api/orders', () => {
  it('金額由伺服端用 priceLine() 重算，不信任用戶端送來的數字（用戶端送的請求本來就不含金額）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const app = createTestApp(db)
    await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV' })),
    })
    const res2 = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest({ idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAW' })),
    })
    const body2 = await readJson(res2)
    expect(body2.orderId).toBe('202406102')
  })

  it('重送同一個 idempotencyKey 回傳原本那筆訂單，不會建立第二筆（冪等）', async () => {
    const db = createTestDb()
    const app = createTestApp(db)
    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest()),
    })
    const firstBody = await readJson(first)
    expect(first.status).toBe(201)

    const second = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest()),
    })
    const secondBody = await readJson(second)
    expect(second.status).toBe(200)
    expect(secondBody.orderId).toBe(firstBody.orderId)

    const list = await readJson(await app.request('/api/orders'))
    expect(list).toHaveLength(1)
  })

  it('拒絕不合法的請求（Zod 驗證失敗，例如空的品項清單）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest({ lines: [] })),
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
