import { describe, expect, it } from 'vitest'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { invoiceTracks } from '../src/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/**
 * 跨租戶隔離測試（多租戶 Phase 2 的安全底線）。用兩個不同 tenantId 的裝置
 * 模擬兩個租戶 A、B，斷言：
 *   1. A 的資料在 B 的清單／查詢裡完全看不到
 *   2. B 不能用 A 的資源 id 讀取／修改／刪除
 *   3. 「用名稱／id 回查」這類容易漏掉租戶過濾的邏輯（deductStock、
 *      resolveOrderPayment 的折價券查找）不會誤用到別的租戶的資料
 *   4. 原本「全店只能有一個 open 班別」這類單租戶假設，現在是「每個
 *      租戶各自」成立，不會互相卡住
 *
 * 故意不測「兩個租戶能不能用同一個 staff.account／members.phone／
 * roles.name」——這些欄位的唯一鍵目前仍是全租戶共用（見 db/schema.ts
 * 的說明，複合鍵留到之後回填真正租戶 id 時才做），現在測會誤判成 bug。
 */

async function twoTenants(db = createTestDb()) {
  const tenantA = await createTestAppWithDevice(db, 'device-a', { tenantId: 'tenant-a' })
  const tenantB = await createTestAppWithDevice(db, 'device-b', { tenantId: 'tenant-b' })
  // 送單需要各自租戶有一組啟用中的發票字軌（見 routes/orders.ts 的
  // nextInvoiceNumber）——不能沿用 helpers/promotions.ts 的 seedPromotions()，
  // 它種的字軌 tenantId 是 null，且 id 固定值，兩個租戶各呼叫一次會撞主鍵。
  await db.insert(invoiceTracks).values([
    {
      id: 'track-tenant-a',
      tenantId: 'tenant-a',
      trackCode: 'AA',
      periodLabel: '測試期別',
      rangeStart: 1,
      rangeEnd: 50000000,
      currentNumber: 0,
      isActive: true
    },
    {
      id: 'track-tenant-b',
      tenantId: 'tenant-b',
      trackCode: 'BB',
      periodLabel: '測試期別',
      rangeStart: 1,
      rangeEnd: 50000000,
      currentNumber: 0,
      isActive: true
    }
  ])
  return { db, tenantA, tenantB }
}

function authHeaders(t: { deviceToken: string; sessionToken: string }) {
  return {
    'Content-Type': 'application/json',
    'X-Device-Token': t.deviceToken,
    'X-Operator-Session': t.sessionToken
  }
}

describe('跨租戶隔離', () => {
  it('菜單：B 看不到 A 建立的分類／品項，也不能編輯或刪除', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const category = await readJson((
      await tenantA.app.request('/api/catalog/categories', {
        method: 'POST',
        headers: authHeaders(tenantA),
        body: JSON.stringify({ name: 'A 的分類' })
      })
    ))

    const catalogB = await readJson((
      await tenantB.app.request('/api/catalog', {
        headers: { 'X-Device-Token': tenantB.deviceToken }
      })
    ))
    expect(catalogB.categories).toEqual([])

    const updateRes = await tenantB.app.request(`/api/catalog/categories/${category.id}`, {
      method: 'PUT',
      headers: authHeaders(tenantB),
      body: JSON.stringify({ name: '改名' })
    })
    expect(updateRes.status).toBe(404)

    const deleteRes = await tenantB.app.request(`/api/catalog/categories/${category.id}`, {
      method: 'DELETE',
      headers: authHeaders(tenantB)
    })
    expect(deleteRes.status).toBe(404)
  })

  it('deductStock：兩個租戶各自有同名品項時，送單只會扣到自己租戶的庫存', async () => {
    const { tenantA, tenantB } = await twoTenants()

    async function seedProduct(t: typeof tenantA, stock: number) {
      const category = await readJson((
        await t.app.request('/api/catalog/categories', {
          method: 'POST',
          headers: authHeaders(t),
          body: JSON.stringify({ name: '飲品' })
        })
      ))
      return readJson(
        await t.app.request('/api/catalog/products', {
          method: 'POST',
          headers: authHeaders(t),
          body: JSON.stringify({
            categoryId: category.id,
            name: '珍珠奶茶',
            basePrice: 80,
            stock,
            modifierGroupIds: []
          })
        })
      )
    }

    const productA = await seedProduct(tenantA, 10)
    await seedProduct(tenantB, 10)

    const orderRes = await tenantA.app.request('/api/orders', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA1',
        businessDate: '20260101',
        staff: '店長 - Lemon',
        lines: [
          {
            name: '珍珠奶茶',
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
        invoiceCarrier: { type: '無載具' }
      })
    })
    expect(orderRes.status).toBe(201)

    const catalogA = await readJson((
      await tenantA.app.request('/api/catalog', { headers: { 'X-Device-Token': tenantA.deviceToken } })
    ))
    const catalogB = await readJson((
      await tenantB.app.request('/api/catalog', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))

    expect(catalogA.products.find((p: { id: string }) => p.id === productA.id).stock).toBe(9)
    // B 的同名品項庫存完全不該被 A 的送單動到。
    expect(catalogB.products[0].stock).toBe(10)
  })

  it('訂單：B 看不到 A 的訂單，也不能用 A 的 orderId 改狀態／退款／刪除', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const orderCreateRes = await tenantA.app.request('/api/orders', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA2',
        businessDate: '20260101',
        staff: '店長 - Lemon',
        lines: [
          {
            name: '測試品項',
            price: 100,
            count: 1,
            addList: '無添加配料',
            addListPrice: 0,
            freeDiscount: false,
            quickDiscountId: null
          }
        ],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 100 }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' }
      })
    })
    expect(orderCreateRes.status).toBe(201)
    const order = await readJson(orderCreateRes)

    const listB = await readJson((
      await tenantB.app.request('/api/orders', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(listB.items).toEqual([])

    const statusRes = await tenantB.app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(tenantB),
      body: JSON.stringify({ orderStatus: '已取消', operator: 'B 的人', reason: '亂改' })
    })
    expect(statusRes.status).toBe(404)

    const refundRes = await tenantB.app.request(`/api/orders/${order.orderId}/refunds`, {
      method: 'POST',
      headers: authHeaders(tenantB),
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FC1', amount: 1, reason: '亂退', operator: 'B 的人' })
    })
    expect(refundRes.status).toBe(404)

    const deleteRes = await tenantB.app.request(`/api/orders/${order.orderId}`, {
      method: 'DELETE',
      headers: authHeaders(tenantB)
    })
    expect(deleteRes.status).toBe(404)
  })

  it('折價券：B 送單套用 A 的 couponId 時查不到，回傳 400，不會用到 A 的折扣資料', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const coupon = await readJson((
      await tenantA.app.request('/api/promotions/order-coupons', {
        method: 'POST',
        headers: authHeaders(tenantA),
        body: JSON.stringify({ name: 'A 的折價券', kind: 'amount', value: 9999 })
      })
    ))

    const orderRes = await tenantB.app.request('/api/orders', {
      method: 'POST',
      headers: authHeaders(tenantB),
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA3',
        businessDate: '20260101',
        staff: 'B 的店長',
        // coupon 解析比 tenders 驗證先跑，實際扣抵金額在這裡不重要——
        // 只是要通過 schema 的「至少 1 筆」驗證，讓請求走到 coupon 那一步。
        lines: [
          {
            name: '測試品項',
            price: 100,
            count: 1,
            addList: '無添加配料',
            addListPrice: 0,
            freeDiscount: false,
            quickDiscountId: null
          }
        ],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 100 }],
        appliedCoupon: { type: 'coupon', couponId: coupon.id },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' }
      })
    })
    expect(orderRes.status).toBe(400)
    const body = await readJson(orderRes)
    expect(body.error).toBe('找不到這張折價券')
  })

  it('會員：B 看不到 A 的會員，用 A 的 id 查詢回傳 404', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const member = await readJson((
      await tenantA.app.request('/api/members', {
        method: 'POST',
        headers: authHeaders(tenantA),
        body: JSON.stringify({ name: 'A 的會員', phone: '0911000001' })
      })
    ))

    // 整批撈會員名單、查詳細資料都需要 canCheckMembers（見 routes/members.ts），
    // 用 authHeaders 附上 tenantB 全權限操作員的 session。
    const listB = await readJson((
      await tenantB.app.request('/api/members', { headers: authHeaders(tenantB) })
    ))
    expect(listB.items).toEqual([])

    const getRes = await tenantB.app.request(`/api/members/${member.id}`, {
      headers: authHeaders(tenantB)
    })
    expect(getRes.status).toBe(404)
  })

  it('桌況：B 看不到 A 的桌位，不能編輯 A 的桌況', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const table = await readJson((
      await tenantA.app.request('/api/tables', {
        method: 'POST',
        headers: authHeaders(tenantA),
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    ))

    const listB = await readJson((
      await tenantB.app.request('/api/tables', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(listB).toEqual([])

    const patchRes = await tenantB.app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers: authHeaders(tenantB),
      body: JSON.stringify({ status: 'occupied' })
    })
    expect(patchRes.status).toBe(404)
  })

  it('付款方式：B 看不到 A 新增的付款方式', async () => {
    const { tenantA, tenantB } = await twoTenants()

    await tenantA.app.request('/api/payment-methods', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({ name: 'A 的行動支付', disabled: false, useMethod: '手機' })
    })

    const listB = await readJson((
      await tenantB.app.request('/api/payment-methods', {
        headers: { 'X-Device-Token': tenantB.deviceToken }
      })
    ))
    expect(listB).toEqual([])
  })

  it('營業設定：A 調整換日時間不影響 B，B 仍是預設值', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const updateRes = await tenantA.app.request('/api/tenant-settings', {
      method: 'PUT',
      headers: authHeaders(tenantA),
      body: JSON.stringify({ businessDayStartHour: 18 })
    })
    expect(updateRes.status).toBe(200)

    const settingsB = await readJson((
      await tenantB.app.request('/api/tenant-settings', {
        headers: { 'X-Device-Token': tenantB.deviceToken }
      })
    ))
    expect(settingsB).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })

  it('裝置：B 的裝置清單看不到 A 的裝置', async () => {
    const { tenantB } = await twoTenants()

    const listB = await readJson((
      await tenantB.app.request('/api/devices', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(listB.every((d: { name: string }) => d.name !== 'device-a')).toBe(true)
  })

  it('權限群組與員工：B 看不到 A 建立的角色與員工', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const role = await readJson((
      await tenantA.app.request('/api/roles', {
        method: 'POST',
        headers: authHeaders(tenantA),
        body: JSON.stringify({ name: 'A 專屬角色', capabilities: [] })
      })
    ))
    await tenantA.app.request('/api/staff', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({ name: 'A 的員工', jobTitle: '店員', account: 'tenant-a-only', roleId: role.id, pin: '1234' })
    })

    const rolesB = await readJson((
      await tenantB.app.request('/api/roles', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(rolesB.find((r: { id: string }) => r.id === role.id)).toBeUndefined()

    const staffB = await readJson((
      await tenantB.app.request('/api/staff', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(staffB.find((s: { account: string }) => s.account === 'tenant-a-only')).toBeUndefined()

    // B 的裝置就算知道帳號密碼，PIN 登入也查不到 A 的員工（帳號查找已按租戶過濾）。
    const loginRes = await tenantB.app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': tenantB.deviceToken },
      body: JSON.stringify({ account: 'tenant-a-only', pin: '1234' })
    })
    expect(loginRes.status).toBe(401)
  })

  it('班別：兩個租戶可以同時各自開帳，B 開不到帳看不到 A 的 open 班別不會被卡住', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const openA = await tenantA.app.request('/api/shifts', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FD1', operator: 'A 店長', openingFloat: 3000 })
    })
    expect(openA.status).toBe(201)

    // 在舊的單租戶假設下，這一步會因為「已經有一筆班別是開帳狀態」被 409 擋下。
    const openB = await tenantB.app.request('/api/shifts', {
      method: 'POST',
      headers: authHeaders(tenantB),
      body: JSON.stringify({ shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FD2', operator: 'B 店長', openingFloat: 2000 })
    })
    expect(openB.status).toBe(201)

    const currentB = await readJson((
      await tenantB.app.request('/api/shifts/current', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(currentB.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FD2')
  })

  it('報表：B 的營收報表看不到 A 的訂單金額', async () => {
    const { tenantA, tenantB } = await twoTenants()

    const orderRes = await tenantA.app.request('/api/orders', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({
        idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA4',
        businessDate: '20260101',
        staff: 'A 的店長',
        lines: [
          {
            name: '測試品項',
            price: 100,
            count: 1,
            addList: '無添加配料',
            addListPrice: 0,
            freeDiscount: false,
            quickDiscountId: null
          }
        ],
        bagCount: 0,
        tenders: [{ method: '現金', amount: 100 }],
        appliedCoupon: { type: 'none' },
        orderChannel: '外帶',
        invoiceCarrier: { type: '無載具' }
      })
    })
    expect(orderRes.status).toBe(201)

    const reportB = await readJson((
      await tenantB.app.request('/api/reports/sales?from=20260101&to=20260101', {
        headers: { 'X-Device-Token': tenantB.deviceToken }
      })
    ))
    expect(reportB.orderCount).toBe(0)
    expect(reportB.dailyRevenue).toEqual([{ businessDate: '20260101', revenue: 0 }])
  })

  it('稽核紀錄：B 看不到 A 的稽核紀錄', async () => {
    const { tenantA, tenantB } = await twoTenants()

    await tenantA.app.request('/api/audit-logs', {
      method: 'POST',
      headers: authHeaders(tenantA),
      body: JSON.stringify({ action: 'open_cash_drawer', operator: 'A 的人', detail: '開錢箱' })
    })

    const listB = await readJson((
      await tenantB.app.request('/api/audit-logs', { headers: { 'X-Device-Token': tenantB.deviceToken } })
    ))
    expect(listB).toEqual([])
  })
})
