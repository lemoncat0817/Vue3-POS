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

  it('核發成功寫入操作紀錄 device.issue——核發密鑰保護的端點沒有操作員身分，operator 記固定字串', async () => {
    const db = createTestDb()
    const app = createTestApp(db)
    await app.request('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provisioning-Secret': TEST_PROVISIONING_SECRET
      },
      body: JSON.stringify({ name: '前台收銀機' })
    })

    // 核發出來的裝置落在「未分配租戶」過渡池（tenantId: null），要用同一個
    // 池子裡的裝置／session 才查得到這筆紀錄；createTestAppWithDevice() 自己
    // 核發的那台裝置也會留一筆 device.issue，用 keyword 篩掉不相干的那筆。
    const { app: appWithSession, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const list = (await (
      await appWithSession.request('/api/audit-logs?action=device.issue&keyword=前台收銀機', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    ).json()) as { items: Array<{ operator: string; detail: string }> }
    expect(list.items).toHaveLength(1)
    expect(list.items[0]).toMatchObject({
      operator: '系統（裝置核發密鑰）',
      detail: '核發裝置憑證「前台收銀機」'
    })
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

describe('GET /api/devices/me（查目前這台裝置）', () => {
  it('沒有裝置憑證時拒絕', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/devices/me')
    expect(res.status).toBe(401)
  })

  it('回傳自己的名稱，不是清單裡的第一筆', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db, '前台收銀機')

    // 同一個租戶下再核發一台裝置，確保 /me 認得「自己」而不是隨便回一筆。
    await app.request('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provisioning-Secret': TEST_PROVISIONING_SECRET
      },
      body: JSON.stringify({ name: '後台備用機' })
    })

    const res = await app.request('/api/devices/me', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { name: string }
    expect(body.name).toBe('前台收銀機')
  })
})

// requireCapability() 本身（缺權限時擋下、回傳 403）已經在
// require-capability.spec.ts 集中驗證過，這裡不重複覆蓋，只驗證
// 「權限足夠時」這支端點自己的業務邏輯。
describe('PATCH /api/devices/:id（改名）', () => {
  it('有權限時更新名稱，並寫入操作紀錄 device.rename', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db, '前台收銀機')
    const meRes = await app.request('/api/devices/me', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    const me = (await meRes.json()) as { id: string }

    const res = await app.request(`/api/devices/${me.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '旗艦店 · 機台 A' })
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { name: string }
    expect(body.name).toBe('旗艦店 · 機台 A')

    // GET /devices/me 重新查一次，確認名稱真的落地，不是只有回應本身這樣寫。
    const meAfter = (await (
      await app.request('/api/devices/me', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    ).json()) as { name: string }
    expect(meAfter.name).toBe('旗艦店 · 機台 A')

    const auditList = (await (
      await app.request('/api/audit-logs?action=device.rename', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    ).json()) as { items: Array<{ detail: string }> }
    expect(auditList.items).toHaveLength(1)
    expect(auditList.items[0]!.detail).toBe('裝置「前台收銀機」重新命名為「旗艦店 · 機台 A」')
  })

  it('找不到裝置時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/devices/does-not-exist', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '新名字' })
    })
    expect(res.status).toBe(404)
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
