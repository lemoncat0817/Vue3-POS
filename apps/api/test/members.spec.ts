import { describe, expect, it } from 'vitest'
import { invoiceTracks } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/** 會員管理 API 測試。 */
describe('POST /api/members', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '王小明', phone: '0912345678' })
    })
    expect(res.status).toBe(401)
  })

  it('新增成功，id 由伺服端配發、點數從 0 開始', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '王小明', phone: '0912345678' })
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({ name: '王小明', phone: '0912345678', points: 0 })
    expect(typeof body.id).toBe('string')
    expect(body.id.length).toBeGreaterThan(0)
  })

  it('同一個手機號碼重複註冊時拒絕，回傳 409', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '王小明', phone: '0912345678' })
    })
    const res = await app.request('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '另一個人', phone: '0912345678' })
    })
    expect(res.status).toBe(409)
  })
})

describe('GET /api/members', () => {
  it('可以用手機號碼查詢，結帳當下用得到（不需要拉全部會員清單）', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    await app.request('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '王小明', phone: '0912345678' })
    })
    await app.request('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '林小華', phone: '0987654321' })
    })

    const res = await app.request('/api/members?phone=0987654321', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    const body = await readJson(res)
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ name: '林小華' })
  })
})

describe('GET /api/members/:id、PUT、DELETE', () => {
  it('找不到會員時通通回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    expect((await app.request('/api/members/does-not-exist', { headers })).status).toBe(404)
    expect(
      (
        await app.request('/api/members/does-not-exist', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: 'x', phone: 'y' })
        })
      ).status
    ).toBe(404)
    expect(
      (await app.request('/api/members/does-not-exist', { method: 'DELETE', headers })).status
    ).toBe(404)
  })

  it('更新資料、刪除都正常運作；改成別人已經用過的手機號碼會被擋（409）', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const a = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'A', phone: '0911111111' })
      })
    )
    const b = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'B', phone: '0922222222' })
      })
    )

    const conflictRes = await app.request(`/api/members/${b.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'B', phone: '0911111111' })
    })
    expect(conflictRes.status).toBe(409)

    const updateRes = await app.request(`/api/members/${a.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'A改名', phone: '0911111111' })
    })
    expect(updateRes.status).toBe(200)
    expect(await readJson(updateRes)).toMatchObject({ name: 'A改名' })

    const deleteRes = await app.request(`/api/members/${a.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(deleteRes.status).toBe(204)
    expect(
      (
        await app.request(`/api/members/${a.id}`, {
          headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
        })
      ).status
    ).toBe(404)
  })

  it('刪除有消費紀錄的會員：訂單本身保留，只是解除會員關聯，不是被 FK 約束擋下來', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }

    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0933333333' })
      })
    )
    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA9',
        businessDate: '20240610',
        staff: '店長 - Lemon',
        lines: [
          {
            name: '楊枝甘露2.0',
            price: 80,
            count: 1,
            addList: '無添加配料',
            addListPrice: 0,
            freeDiscount: false,
            quickDiscountId: null
          }
        ],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 80 }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' },
        memberId: member.id
      })
    })
    const order = await readJson(orderRes)
    expect(order.memberId).toBe(member.id)

    const deleteRes = await app.request(`/api/members/${member.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(deleteRes.status).toBe(204)

    const list = await readJson(
      await app.request('/api/orders', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    const persistedOrder = list.items.find(
      (item: { orderId: string }) => item.orderId === order.orderId
    )
    expect(persistedOrder).toBeDefined()
    expect(persistedOrder.memberId).toBeNull()
  })
})

/**
 * 送單掛會員後累加點數、消費紀錄看得到這筆訂單（P22）：見
 * routes/orders.ts 的 accrueMemberPoints。
 */
describe('POST /api/orders 掛會員（P22）', () => {
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

  it('訂單掛會員後，依應付金額累加點數（每 10 元 1 點），消費紀錄看得到這筆訂單', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }

    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0912345678' })
      })
    )

    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(buildRequest({ memberId: member.id }))
    })
    expect(orderRes.status).toBe(201)
    const orderBody = await readJson(orderRes)
    expect(orderBody.memberId).toBe(member.id)
    // 應付金額 160 元，每 10 元 1 點 = 16 點。
    expect(orderBody.orderPaymentPrice).toBe(160)

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(16)
    expect(detail.orders).toHaveLength(1)
    expect(detail.orders[0]).toMatchObject({ orderId: orderBody.orderId, orderPaymentPrice: 160 })
  })

  it('沒有掛會員的訂單，memberId 是 null，不影響任何會員的點數', async () => {
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
    expect((await readJson(res)).memberId).toBeNull()
  })

  it('memberId 對應不到任何會員時，訂單仍然成立（不因為找不到會員就整筆失敗）', async () => {
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
      body: JSON.stringify(buildRequest({ memberId: 'does-not-exist' }))
    })
    expect(res.status).toBe(201)
    // 無效的 memberId 不會被存進訂單（orders.member_id 有外鍵約束，
    // 見 resolveMemberId 的說明），回應上看到的是 null，不是那個
    // 傳進去但找不到的 id。
    expect((await readJson(res)).memberId).toBeNull()
  })
})

/**
 * 退款／作廢會回收先前累加的點數，不再是「退款後點數還留著」（見
 * routes/orders.ts 的 remainingReversiblePoints／pointsWithheldForRefundedAmount）。
 */
describe('退款／作廢會收回會員點數', () => {
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

  async function setupMemberOrder(db: ReturnType<typeof createTestDb>) {
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0912345678' })
      })
    )
    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(buildRequest({ memberId: member.id }))
    })
    const order = await readJson(orderRes)
    return { app, headers, member, order }
  }

  it('部分退款依「退款金額佔應付金額」的比例收回點數', async () => {
    const db = createTestDb()
    const { app, headers, member, order } = await setupMemberOrder(db)
    // 應付金額 160 元累加 16 點；退一半金額（80 元）應收回一半點數（8 點）。
    const refundRes = await app.request(`/api/orders/${order.orderId}/refunds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FB1',
        amount: 80,
        reason: '少一杯',
        operator: '店長 - Lemon'
      })
    })
    expect(refundRes.status).toBe(201)

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(8)
  })

  it('整單作廢收回全部點數；撤銷作廢（改回已完成）原數退還', async () => {
    const db = createTestDb()
    const { app, headers, member, order } = await setupMemberOrder(db)

    const voidRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試作廢' })
    })
    expect(voidRes.status).toBe(200)
    const afterVoid = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(afterVoid.points).toBe(0)

    const restoreRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已完成', operator: '店長 - Lemon' })
    })
    expect(restoreRes.status).toBe(200)
    const afterRestore = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(afterRestore.points).toBe(16)
  })

  it('先部分退款、再整單作廢，只收回「還沒被退款收回」的剩餘點數', async () => {
    const db = createTestDb()
    const { app, headers, member, order } = await setupMemberOrder(db)

    // 先退 80 元（收回 8 點，剩 8 點），再整單作廢應該只再收回剩下的 8 點。
    await app.request(`/api/orders/${order.orderId}/refunds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        refundId: '01ARZ3NDEKTSV4RRFFQ69G5FB2',
        amount: 80,
        reason: '少一杯',
        operator: '店長 - Lemon'
      })
    })
    const voidRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試作廢' })
    })
    expect(voidRes.status).toBe(200)

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(0)
  })
})

/** 業主可自訂「消費多少元累加 1 點」，見 routes/tenant-settings.ts。 */
describe('會員點數比例可由租戶自訂（PUT /api/tenant-settings）', () => {
  it('調整 pointsPerCurrencyUnit 後，新訂單依新比例累加點數', async () => {
    const db = createTestDb()
    // PUT /api/tenant-settings 要更新的租戶列要先存在（見 routes/tenant-settings.ts
    // 的「找不到這個租戶」404），沒指定 tenantId 時裝置停留在過渡池、沒有對應的
    // users 列，這裡跟 tenant-isolation.spec.ts 的 twoTenants() 一樣自行指定
    // tenantId 並各自種一組發票字軌（不能沿用 seedPromotions()，它種的字軌
    // tenantId 是 null，跟自訂的 tenantId 對不上）。
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db, 'test-device', {
      tenantId: 'tenant-1'
    })
    await db.insert(invoiceTracks).values({
      id: 'track-tenant-1',
      tenantId: 'tenant-1',
      trackCode: 'AA',
      periodLabel: '測試期別',
      rangeStart: 1,
      rangeEnd: 50000000,
      currentNumber: 0,
      isActive: true
    })
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const settingsRes = await app.request('/api/tenant-settings', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ pointsPerCurrencyUnit: 5 })
    })
    expect(settingsRes.status).toBe(200)

    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0912345678' })
      })
    )
    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FB3',
        businessDate: '20240610',
        staff: '店長 - Lemon',
        lines: [
          {
            name: '楊枝甘露2.0',
            price: 80,
            count: 2,
            addList: '無添加配料',
            addListPrice: 0,
            freeDiscount: false,
            quickDiscountId: null
          }
        ],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 160 }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' },
        memberId: member.id
      })
    })
    expect(orderRes.status).toBe(201)
    // 應付金額 160 元，每 5 元 1 點 = 32 點（原本每 10 元 1 點只會是 16 點）。
    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(32)
  })
})
