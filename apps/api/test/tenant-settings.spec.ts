import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

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
    expect(await res.json()).toEqual({ businessDayStartHour: 4 })
  })

  it('已分配租戶但尚未調整過時，回傳欄位預設值 4 點', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      tenantId: 'tenant-1'
    })
    const res = await app.request('/api/tenant-settings', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ businessDayStartHour: 4 })
  })
})

describe('PUT /api/tenant-settings', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/tenant-settings', {
      method: 'PUT',
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
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 18 })
    })
    expect(updateRes.status).toBe(200)
    expect(await readJson(updateRes)).toEqual({ businessDayStartHour: 18 })

    const getRes = await app.request('/api/tenant-settings', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(await readJson(getRes)).toEqual({ businessDayStartHour: 18 })
  })

  it('換日時間超出 0～23 範圍時拒絕，回傳 400', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      'test-device',
      { tenantId: 'tenant-1' }
    )
    const res = await app.request('/api/tenant-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ businessDayStartHour: 24 })
    })
    expect(res.status).toBe(400)
  })

  it('裝置尚未分配租戶時，找不到租戶可更新，回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/tenant-settings', {
      method: 'PUT',
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
