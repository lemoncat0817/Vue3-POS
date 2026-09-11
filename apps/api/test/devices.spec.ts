import { describe, expect, it } from 'vitest'
import { devices } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice, TEST_PROVISIONING_SECRET } from './helpers/app'
import { createTestDb } from './helpers/db'

describe('POST /api/devices（核發裝置憑證）', () => {
  it('沒有帶核發密鑰時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '前台收銀機' })
    })
    expect(res.status).toBe(401)
  })

  it('核發密鑰正確時建立裝置，回傳明碼 token（只有這一次）', async () => {
    const db = createTestDb()
    const app = createTestApp(db)
    const res = await app.request('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provisioning-Secret': TEST_PROVISIONING_SECRET
      },
      body: JSON.stringify({ name: '前台收銀機' })
    })
    expect(res.status).toBe(201)

    const body = (await res.json()) as {
      id: string
      name: string
      token: string
      revokedAt: string | null
    }
    expect(body.name).toBe('前台收銀機')
    expect(body.token).toMatch(/^[0-9a-f]{64}$/)
    expect(body.revokedAt).toBeNull()

    // 資料庫裡不會存明碼，只有雜湊值。
    const rows = await db.select().from(devices).all()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.tokenHash).not.toBe(body.token)
  })

  it('用核發密鑰打不進其他需要裝置憑證的端點（兩把密鑰不能互相冒充）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/devices', {
      headers: { 'X-Device-Token': TEST_PROVISIONING_SECRET }
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/devices（裝置清單，需要裝置憑證）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/devices')
    expect(res.status).toBe(401)
  })

  it('有裝置憑證時回傳清單，不含憑證本身', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(
      createTestDb(),
      '前台收銀機'
    )

    const res = await app.request('/api/devices', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Array<Record<string, unknown>>
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ name: '前台收銀機' })
    expect(body[0]).not.toHaveProperty('token')
    expect(body[0]).not.toHaveProperty('tokenHash')
  })
})

describe('POST /api/devices/:id/revoke（撤銷）', () => {
  it('只撤銷指定的那一台，不影響其他裝置', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db, '前台收銀機')

    const secondRes = await app.request('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provisioning-Secret': TEST_PROVISIONING_SECRET
      },
      body: JSON.stringify({ name: '後台備用機' })
    })
    const deviceB = (await secondRes.json()) as { id: string; token: string }

    const listBefore = (await (
      await app.request('/api/devices', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    ).json()) as Array<{ id: string; name: string }>
    const deviceA = listBefore.find((d) => d.name === '前台收銀機')!

    const revokeRes = await app.request(`/api/devices/${deviceA.id}/revoke`, {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(revokeRes.status).toBe(200)

    // 用「還沒被撤銷」的裝置 B 的憑證來查清單——裝置 A 的憑證這時已經
    // 撤銷，不能再拿它自己來驗證撤銷後的結果。
    const list = (await (
      await app.request('/api/devices', { headers: { 'X-Device-Token': deviceB.token } })
    ).json()) as Array<{ id: string; revokedAt: string | null }>
    const a = list.find((d) => d.id === deviceA.id)
    const b = list.find((d) => d.id === deviceB.id)
    expect(a?.revokedAt).not.toBeNull()
    expect(b?.revokedAt).toBeNull()
  })

  it('找不到裝置時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/devices/does-not-exist/revoke', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(404)
  })
})
