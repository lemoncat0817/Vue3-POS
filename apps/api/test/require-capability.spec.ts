import { describe, expect, it } from 'vitest'
import type { AuthorityKey } from '@pos/contract'
import { members, staff } from '../src/db/schema'
import { createTestAppWithDevice, issueTestSession } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seedRole } from './helpers/roles'

/**
 * requireCapability()（見 src/middleware/require-capability.ts）是「後端
 * 也擋一次操作者權限」的最後一道防線，取代過去只驗證裝置憑證、不驗證
 * 操作者身分的做法。這裡只挑幾個有代表性的路由驗證中介軟體本身的行為
 * （缺 X-Operator-Session、session 查無此人、權限不足、權限足夠），不
 * 逐一覆蓋每個掛了它的端點——那些端點各自的業務邏輯測試已經在用
 * createTestAppWithDevice() 附掛的全權限操作員驗證過「權限足夠時能正常
 * 運作」。
 */
async function seedStaffWithCapabilities(
  db: TestDb,
  capabilities: AuthorityKey[]
): Promise<{ staffId: string; sessionToken: string }> {
  const roleId = await seedRole(db, { capabilities })
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
  return { staffId, sessionToken }
}

describe('requireCapability()：以 POST /api/catalog/categories 為代表', () => {
  it('缺少 X-Operator-Session 時拒絕，回傳 401', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('操作員 session') })
  })

  it('session token 查無此人時拒絕，回傳 401', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': 'does-not-exist'
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })

  it('直接送出員工的 id（不是 session token）也拒絕——staffId 是 GET /api/staff 就查得到的公開資訊，不能拿來冒充身分', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { staffId } = await seedStaffWithCapabilities(db, ['canSetCategory'])

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': staffId
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })

  it('session 已被撤銷（登出）後就不再能通過檢查', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canSetCategory'])

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(logout.status).toBe(204)

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })

  it('操作員的角色沒有 canSetCategory 時拒絕，回傳 403（即使裝置憑證與 session 都合法）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('權限') })
  })

  it('操作員的角色有 canSetCategory 時允許，回傳 201', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canSetCategory'])

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(201)
  })
})

describe('requireCapability()：訂單狀態變更依請求內容決定所需權限（PATCH /api/orders/:orderId/status）', () => {
  it('改為已完成只需要 canEditOrderStatus，沒有 canRefundOrVoid 也可以', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canEditOrderStatus'])

    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已完成', operator: '測試員工' })
    })
    // 訂單不存在會是 404，但代表已經通過權限檢查——重點是不是 403。
    expect(res.status).toBe(404)
  })

  it('改為已取消（作廢）需要 canRefundOrVoid，只有 canEditOrderStatus 會被擋下，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canEditOrderStatus'])

    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ orderStatus: '已取消', operator: '測試員工', reason: '測試' })
    })
    expect(res.status).toBe(403)
  })
})

/**
 * 會員列表原本沒有依 phone 查詢時（整批撈出全店會員姓名＋電話）完全沒有
 * 權限檢查，任何裝置憑證都能撈出全店會員個資，見 routes/members.ts。
 */
describe('requireCapability()：GET /api/members 依是否帶 phone 動態決定要不要檢查權限', () => {
  it('帶 phone 查單一會員時，即使沒有 canCheckMembers 也能查（結帳流程要用）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await db.insert(members).values({
      id: 'member-1',
      tenantId: null,
      name: '王小明',
      phone: '0912345678',
      points: 0,
      createdAt: new Date().toISOString()
    })
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/members?phone=0912345678', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(200)
  })

  it('沒帶 phone（整批撈會員名單）時，沒有 canCheckMembers 會被擋下，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/members', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(403)
  })

  it('沒帶 phone 但有 canCheckMembers 時允許，回傳 200', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckMembers'])

    const res = await app.request('/api/members', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(200)
  })
})

describe('requireCapability()：POST /api/devices/:id/revoke 需要 canManageDevices', () => {
  it('沒有 canManageDevices 時拒絕，回傳 403（原本完全沒有權限檢查）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/devices/does-not-exist/revoke', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(403)
  })

  it('有 canManageDevices 時允許（裝置不存在則是 404，代表已通過權限檢查）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canManageDevices'])

    const res = await app.request('/api/devices/does-not-exist/revoke', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(404)
  })
})

describe('requireCapability()：POST /api/audit-logs 需要 canOpenCashier', () => {
  it('沒有 canOpenCashier 時拒絕，回傳 403（原本完全沒有權限檢查）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ action: 'cashier_open', operator: '測試員工', detail: '測試' })
    })
    expect(res.status).toBe(403)
  })

  it('有 canOpenCashier 時允許，回傳 201', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canOpenCashier'])

    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ action: 'cashier_open', operator: '測試員工', detail: '測試' })
    })
    expect(res.status).toBe(201)
  })
})
