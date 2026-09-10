import { describe, expect, it } from 'vitest'
import type { AuthorityKey } from '@pos/contract'
import { staff } from '../src/db/schema'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seedRole } from './helpers/roles'

/**
 * requireCapability()（見 src/middleware/require-capability.ts）是「後端
 * 也擋一次操作者權限」的最後一道防線，取代過去只驗證裝置憑證、不驗證
 * 操作者身分的做法。這裡只挑幾個有代表性的路由驗證中介軟體本身的行為
 * （缺 X-Staff-Id、staffId 查無此人、權限不足、權限足夠），不逐一覆蓋
 * 每個掛了它的端點——那些端點各自的業務邏輯測試已經在用
 * createTestAppWithDevice() 附掛的全權限操作員驗證過「權限足夠時能正常
 * 運作」。
 */
async function seedStaffWithCapabilities(db: TestDb, capabilities: AuthorityKey[]) {
  const roleId = await seedRole(db, { capabilities })
  const staffId = crypto.randomUUID()
  await db.insert(staff).values({
    id: staffId,
    name: '測試員工',
    jobTitle: '測試',
    account: `staff-${staffId}`,
    roleId,
    pinHash: 'x',
    pinSalt: 'x',
  })
  return staffId
}

describe('requireCapability()：以 POST /api/catalog/categories 為代表', () => {
  it('缺少 X-Staff-Id 時拒絕，回傳 401', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '主餐' }),
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('操作員身分') })
  })

  it('X-Staff-Id 查無此人時拒絕，回傳 401', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': 'does-not-exist' },
      body: JSON.stringify({ name: '主餐' }),
    })
    expect(res.status).toBe(401)
  })

  it('操作員的角色沒有 canSetCategory 時拒絕，回傳 403（即使裝置憑證合法）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const noPermissionStaffId = await seedStaffWithCapabilities(db, ['canCheckOrder'])

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': noPermissionStaffId },
      body: JSON.stringify({ name: '主餐' }),
    })
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('權限') })
  })

  it('操作員的角色有 canSetCategory 時允許，回傳 201', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const managerStaffId = await seedStaffWithCapabilities(db, ['canSetCategory'])

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': managerStaffId },
      body: JSON.stringify({ name: '主餐' }),
    })
    expect(res.status).toBe(201)
  })
})

describe('requireCapability()：訂單狀態變更依請求內容決定所需權限（PATCH /api/orders/:orderId/status）', () => {
  it('改為已完成只需要 canEditOrderStatus，沒有 canRefundOrVoid 也可以', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const editorStaffId = await seedStaffWithCapabilities(db, ['canEditOrderStatus'])

    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': editorStaffId },
      body: JSON.stringify({ orderStatus: '已完成', operator: '測試員工' }),
    })
    // 訂單不存在會是 404，但代表已經通過權限檢查——重點是不是 403。
    expect(res.status).toBe(404)
  })

  it('改為已取消（作廢）需要 canRefundOrVoid，只有 canEditOrderStatus 會被擋下，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const editorStaffId = await seedStaffWithCapabilities(db, ['canEditOrderStatus'])

    const res = await app.request('/api/orders/does-not-exist/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': editorStaffId },
      body: JSON.stringify({ orderStatus: '已取消', operator: '測試員工', reason: '測試' }),
    })
    expect(res.status).toBe(403)
  })
})
