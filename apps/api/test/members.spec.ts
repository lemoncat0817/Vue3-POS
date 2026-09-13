import { describe, expect, it, vi } from 'vitest'
import { invoiceTracks, staff } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice, issueTestSession } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'
import { seedRole } from './helpers/roles'

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
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toMatchObject({ name: '林小華' })
  })

  it('依姓名或手機號碼模糊搜尋（q），並依 page／pageSize 分頁', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const seeds = [
      { name: '王小明', phone: '0911111111' },
      { name: '王大明', phone: '0922222222' },
      { name: '林小華', phone: '0933333333' }
    ]
    for (const seed of seeds) {
      await app.request('/api/members', { method: 'POST', headers, body: JSON.stringify(seed) })
    }

    const byName = await readJson(await app.request('/api/members?q=王', { headers }))
    expect(byName.items.map((m: { name: string }) => m.name).sort()).toEqual(['王大明', '王小明'])

    const byPhone = await readJson(await app.request('/api/members?q=0933333333', { headers }))
    expect(byPhone.items).toHaveLength(1)
    expect(byPhone.items[0]).toMatchObject({ name: '林小華' })

    const page1 = await readJson(await app.request('/api/members?pageSize=2&page=1', { headers }))
    expect(page1.items).toHaveLength(2)
    expect(page1.pagination).toMatchObject({ page: 1, pageSize: 2, totalCount: 3, totalPages: 2 })
    const page2 = await readJson(await app.request('/api/members?pageSize=2&page=2', { headers }))
    expect(page2.items).toHaveLength(1)
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
          body: JSON.stringify({ name: 'x', phone: '0900000000' })
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

  it('刪除有消費紀錄的會員是軟刪除：訂單與點數異動明細都保留正確的會員關聯', async () => {
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
    // 軟刪除不再需要斷開關聯，訂單的 memberId 維持指向那個（已刪除的）會員。
    expect(persistedOrder.memberId).toBe(member.id)

    // 刪除後這個會員在一般查詢裡形同不存在：查不到、也搜尋不到。
    expect((await app.request(`/api/members/${member.id}`, { headers })).status).toBe(404)
    const list2 = await readJson(await app.request('/api/members', { headers }))
    expect(list2.items.find((item: { id: string }) => item.id === member.id)).toBeUndefined()
  })

  it('刪除找不到會員時回傳 404；重複刪除同一個會員第二次也回傳 404', async () => {
    const db = createTestDb()
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
        body: JSON.stringify({ name: '王小明', phone: '0955555555' })
      })
    )
    const first = await app.request(`/api/members/${member.id}`, {
      method: 'DELETE',
      headers
    })
    expect(first.status).toBe(204)
    const second = await app.request(`/api/members/${member.id}`, {
      method: 'DELETE',
      headers
    })
    expect(second.status).toBe(404)
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
    expect(detail.orders.items).toHaveLength(1)
    expect(detail.orders.items[0]).toMatchObject({
      orderId: orderBody.orderId,
      orderPaymentPrice: 160
    })
    expect(detail.orders.pagination).toMatchObject({ totalCount: 1, totalPages: 1 })
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

describe('GET /api/members/:id 消費紀錄分頁', () => {
  it('依 page／pageSize 分頁，最新的訂單排最前面', async () => {
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
    const validLine = {
      name: '楊枝甘露2.0',
      price: 80,
      count: 1,
      addList: '無添加配料' as const,
      addListPrice: 0,
      freeDiscount: false,
      quickDiscountId: null
    }
    const idempotencyKeys = [
      '01ARZ3NDEKTSV4RRFFQ69G5FC1',
      '01ARZ3NDEKTSV4RRFFQ69G5FC2',
      '01ARZ3NDEKTSV4RRFFQ69G5FC3'
    ]
    for (const idempotencyKey of idempotencyKeys) {
      await app.request('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey,
          businessDate: '20240610',
          staff: '店長 - Lemon',
          lines: [validLine],
          bagCount: 0,
          tenders: [{ method: '現金', amount: 80 }],
          appliedCoupon: { type: 'none' },
          orderChannel: '外帶',
          invoiceCarrier: { type: '無載具' },
          memberId: member.id
        })
      })
    }

    const page1 = await readJson(
      await app.request(`/api/members/${member.id}?pageSize=2&page=1`, { headers })
    )
    expect(page1.orders.items).toHaveLength(2)
    expect(page1.orders.pagination).toMatchObject({ page: 1, pageSize: 2, totalCount: 3, totalPages: 2 })

    const page2 = await readJson(
      await app.request(`/api/members/${member.id}?pageSize=2&page=2`, { headers })
    )
    expect(page2.orders.items).toHaveLength(1)
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
    // 消費當下的 order_accrual、退款當下的 refund_reversal 都留在異動明細裡，
    // 最新的排最前面。
    expect(detail.pointsLedger).toHaveLength(2)
    expect(detail.pointsLedger[0]).toMatchObject({
      delta: -8,
      reason: 'refund_reversal',
      orderId: order.orderId
    })
    expect(detail.pointsLedger[1]).toMatchObject({
      delta: 16,
      reason: 'order_accrual',
      orderId: order.orderId
    })
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
    expect(afterVoid.pointsLedger[0]).toMatchObject({ delta: -16, reason: 'void_reversal' })

    const restoreRes = await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已完成', operator: '店長 - Lemon' })
    })
    expect(restoreRes.status).toBe(200)
    const afterRestore = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(afterRestore.points).toBe(16)
    expect(afterRestore.pointsLedger[0]).toMatchObject({ delta: 16, reason: 'restore_award' })
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

/** 手動調整點數：客訴補償、活動加點等沒有對應訂單的異動。 */
describe('POST /api/members/:id/points-adjustments（手動調整點數）', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/members/does-not-exist/points-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: 10, reason: '活動加點', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(401)
  })

  it('找不到會員時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/members/does-not-exist/points-adjustments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ delta: 10, reason: '活動加點', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(404)
  })

  it('加點成功：點數增加、寫入一筆 manual_adjustment 異動明細（含操作人與原因）', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0911222333' })
      })
    )
    const res = await app.request(`/api/members/${member.id}/points-adjustments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ delta: 50, reason: '生日活動加點', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(200)
    expect((await readJson(res)).points).toBe(50)

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(50)
    expect(detail.pointsLedger).toHaveLength(1)
    expect(detail.pointsLedger[0]).toMatchObject({
      delta: 50,
      reason: 'manual_adjustment',
      orderId: null,
      operator: '店長 - Lemon',
      note: '生日活動加點'
    })
  })

  it('扣點超過目前點數時拒絕，回傳 400，點數與異動明細都不受影響', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0911222334' })
      })
    )
    const res = await app.request(`/api/members/${member.id}/points-adjustments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ delta: -10, reason: '扣錯', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(400)

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.points).toBe(0)
    expect(detail.pointsLedger).toHaveLength(0)
  })

  it('調整量是 0 時，請求本身就會被 schema 擋下來，回傳 400', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0911222335' })
      })
    )
    const res = await app.request(`/api/members/${member.id}/points-adjustments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ delta: 0, reason: '測試', operator: '店長 - Lemon' })
    })
    expect(res.status).toBe(400)
  })
})

/** 生日欄位＋本月壽星名單，見 routes/members.ts 的 listMemberBirthdaysRoute。 */
describe('會員生日與本月壽星名單', () => {
  it('新增/編輯會員可以選填生日，格式不對會被擋下', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const res = await app.request('/api/members', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '王小明', phone: '0912345678', birthday: '1995-06-15' })
    })
    expect(res.status).toBe(201)
    const created = await readJson(res)
    expect(created.birthday).toBe('1995-06-15')

    const badFormat = await app.request('/api/members', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '林小華', phone: '0987654321', birthday: '95/06/15' })
    })
    expect(badFormat.status).toBe(400)

    const updateRes = await app.request(`/api/members/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '王小明', phone: '0912345678', birthday: '1995-07-20' })
    })
    expect(updateRes.status).toBe(200)
    expect((await readJson(updateRes)).birthday).toBe('1995-07-20')
  })

  it('沒有填生日時是 null，不影響會員建立', async () => {
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
    expect((await readJson(res)).birthday).toBeNull()
  })

  it('依指定月份列出壽星，依日期排序，跟其他月份的會員無關', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const seeds = [
      { name: '六月晚生日', phone: '0911111111', birthday: '1990-06-20' },
      { name: '六月早生日', phone: '0922222222', birthday: '1988-06-05' },
      { name: '七月生日', phone: '0933333333', birthday: '1992-07-01' },
      { name: '沒填生日', phone: '0944444444' }
    ]
    for (const seed of seeds) {
      await app.request('/api/members', { method: 'POST', headers, body: JSON.stringify(seed) })
    }

    const res = await app.request('/api/members/birthdays?month=06', { headers })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.map((m: { name: string }) => m.name)).toEqual(['六月早生日', '六月晚生日'])
  })

  it('沒帶 month 時預設用伺服端當下月份', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))
    try {
      const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
      const headers = {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      }
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '三月壽星', phone: '0911111111', birthday: '2000-03-10' })
      })
      const res = await app.request('/api/members/birthdays', { headers })
      const body = await readJson(res)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({ name: '三月壽星' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('沒有 canCheckMembers 時查壽星名單會被擋下，回傳 403', async () => {
    const db: TestDb = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const roleId = await seedRole(db, { capabilities: ['canCheckOrder'] })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      name: '測試員工',
      jobTitle: '測試',
      account: `staff-${staffId}`,
      roleId,
      pinHash: 'x',
      pinSalt: 'x'
    })
    const sessionToken = await issueTestSession(db, staffId)

    const res = await app.request('/api/members/birthdays', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(403)
  })
})

/** 會員分級：依累積消費金額即時比對業主自訂門檻，見 routes/members.ts 的 pickTier()。 */
describe('會員清單／詳細資料附上目前分級（tierStatus）', () => {
  const validLine = {
    name: '楊枝甘露2.0',
    price: 80,
    count: 1,
    addList: '無添加配料' as const,
    addListPrice: 0,
    freeDiscount: false,
    quickDiscountId: null
  }

  async function placeOrder(
    app: ReturnType<typeof createTestApp>,
    headers: Record<string, string>,
    idempotencyKey: string,
    memberId: string,
    amount: number
  ) {
    await app.request('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        idempotencyKey,
        businessDate: '20240610',
        staff: '店長 - Lemon',
        lines: [{ ...validLine, price: amount }],
        bagCount: 0,
        tenders: [{ method: '現金', amount }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' },
        memberId
      })
    })
  }

  it('累積消費達到門檻時升級；沒有任何門檻達標時 tier 是 null', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    await app.request('/api/member-tiers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '銀卡會員', minSpend: 100 })
    })
    await app.request('/api/member-tiers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '金卡會員', minSpend: 500 })
    })

    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0912345678' })
      })
    )

    // 還沒有任何消費：沒有門檻達標。
    const beforeDetail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(beforeDetail.tierStatus).toEqual({ tier: null, lifetimeSpend: 0 })

    // 消費 200 元，達到銀卡門檻（100），還沒到金卡（500）。
    await placeOrder(app, headers, '01ARZ3NDEKTSV4RRFFQ69G5FD1', member.id, 200)
    const afterSilver = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(afterSilver.tierStatus).toMatchObject({
      tier: { name: '銀卡會員', minSpend: 100 },
      lifetimeSpend: 200
    })

    // 再消費 400 元，累積 600 元，達到金卡門檻（500），取最高一級。
    await placeOrder(app, headers, '01ARZ3NDEKTSV4RRFFQ69G5FD2', member.id, 400)
    const afterGold = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(afterGold.tierStatus).toMatchObject({
      tier: { name: '金卡會員', minSpend: 500 },
      lifetimeSpend: 600
    })

    // 整批清單（GET /api/members，無 phone）也附上同樣的 tierStatus。
    const list = await readJson(await app.request('/api/members', { headers }))
    const listed = list.items.find((item: { id: string }) => item.id === member.id)
    expect(listed.tierStatus).toMatchObject({ tier: { name: '金卡會員' }, lifetimeSpend: 600 })
  })

  it('作廢的訂單不計入累積消費', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    await app.request('/api/member-tiers', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '銀卡會員', minSpend: 100 })
    })
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
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FD3',
        businessDate: '20240610',
        staff: '店長 - Lemon',
        lines: [validLine],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 80 }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' },
        memberId: member.id
      })
    })
    const order = await readJson(orderRes)
    await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '測試作廢' })
    })

    const detail = await readJson(await app.request(`/api/members/${member.id}`, { headers }))
    expect(detail.tierStatus).toEqual({ tier: null, lifetimeSpend: 0 })
  })
})
