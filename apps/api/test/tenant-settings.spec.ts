import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice, issueTestSession } from './helpers/app'
import { createTestDb, type TestDb } from './helpers/db'
import { seedRole } from './helpers/roles'
import type { AuthorityKey } from '@pos/contract'

async function seedStaffWithCapabilities(
  db: TestDb,
  capabilities: AuthorityKey[],
  tenantId: string | null = 'tenant-1'
): Promise<{ sessionToken: string }> {
  const roleId = await seedRole(db, { capabilities, tenantId })
  const staffId = crypto.randomUUID()
  await db.insert(staff).values({
    id: staffId,
    tenantId,
    name: '測試員工',
    jobTitle: '測試',
    account: `staff-${staffId}`,
    roleId,
    pinHash: 'x',
    pinSalt: 'x'
  })
  const sessionToken = await issueTestSession(db, staffId)
  return { sessionToken }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/** 租戶營業設定 API 測試。 */
describe('GET /api/tenant-settings', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/tenant-settings')
    expect(res.status).toBe(401)
  })

  it('裝置尚未分配租戶（查不到 users 列）時，回傳系統預設值 4 點', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/tenant-settings', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })

  it('已分配租戶但尚未調整過時，回傳欄位預設值（換日時間 4 點、每 10 元 1 點、點數永久有效）', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      tenantId: 'tenant-1'
    })
    const res = await app.request('/api/tenant-settings', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })
})

describe('PATCH /api/tenant-settings', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDayStartHour: 6 })
    })
    expect(res.status).toBe(401)
  })

  it('更新成功後，GET 會反映新的換日時間', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const updateRes = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 18 })
    })
    expect(updateRes.status).toBe(200)
    expect(await readJson(updateRes)).toEqual({
      businessDayStartHour: 18,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })

    const getRes = await app.request('/api/tenant-settings', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(await readJson(getRes)).toEqual({
      businessDayStartHour: 18,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })

  it('只更新點數比例（業主自訂消費多少元累加 1 點）時，換日時間不受影響', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ pointsPerCurrencyUnit: 5 })
    })
    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 5,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })

  it('可以只更新點數折抵比例（業主自訂每多少點折抵 1 元）', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ pointsRedemptionRate: 20 })
    })
    expect(res.status).toBe(200)
    expect(await readJson(res)).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 20,
      pointsExpiryMonths: null
    })
  })

  it('可以設定點數到期規則（幾個月沒有異動整包歸零），也可以再設回 null 停用', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const enableRes = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ pointsExpiryMonths: 6 })
    })
    expect(enableRes.status).toBe(200)
    expect(await readJson(enableRes)).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: 6
    })

    // 明確傳 null 是「停用」，跟沒送這個欄位（維持原值）意義不同，兩者都要能正常運作。
    const disableRes = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ pointsExpiryMonths: null })
    })
    expect(disableRes.status).toBe(200)
    expect(await readJson(disableRes)).toEqual({
      businessDayStartHour: 4,
      pointsPerCurrencyUnit: 10,
      pointsRedemptionRate: 10,
      pointsExpiryMonths: null
    })
  })

  it('沒有 canManageMembers 時，改點數到期規則會被擋下，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      tenantId: 'tenant-1'
    })
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canSetBusinessHours'])
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ pointsExpiryMonths: 12 })
    })
    expect(res.status).toBe(403)
  })

  it('換日時間超出 0～23 範圍時拒絕，回傳 400', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 24 })
    })
    expect(res.status).toBe(400)
  })

  it('沒有 canSetBusinessHours 時，改換日時間會被擋下，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      tenantId: 'tenant-1'
    })
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canManageMembers'])
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 6 })
    })
    expect(res.status).toBe(403)
  })

  it('沒有 canManageMembers 時，改點數比例會被擋下，回傳 403（換日時間需要 canSetBusinessHours 是不同的權限）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      tenantId: 'tenant-1'
    })
    const { sessionToken } = await seedStaffWithCapabilities(db, ['canSetBusinessHours'])
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ pointsPerCurrencyUnit: 5 })
    })
    expect(res.status).toBe(403)
  })

  it('裝置尚未分配租戶時，找不到租戶可更新，回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 6 })
    })
    expect(res.status).toBe(404)
  })
})
