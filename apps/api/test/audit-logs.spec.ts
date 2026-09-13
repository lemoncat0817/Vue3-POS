import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice, issueTestSession } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'
import { staff } from '../src/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

// 稽核紀錄：取代舊版僅在前端 console 印出 log 的做法。
describe('POST /api/audit-logs', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cashier_open',
        operator: '店長 - Lemon',
        detail: '協助客人換零錢'
      })
    })
    expect(res.status).toBe(401)
  })

  it('新增成功，id 與時間由伺服端配發，之後 GET 看得到這筆紀錄', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        action: 'cashier_open',
        operator: '店長 - Lemon',
        detail: '協助客人換零錢'
      })
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({
      action: 'cashier_open',
      operator: '店長 - Lemon',
      detail: '協助客人換零錢'
    })
    expect(typeof body.id).toBe('number')
    expect(typeof body.createdAt).toBe('string')

    // 篩 action=cashier_open：createTestAppWithDevice() 本身會先核發一台
    // 裝置，現在也會寫一筆 device.issue 操作紀錄（見 routes/devices.ts），
    // 這裡只在乎這個測試自己新增的 cashier_open 那筆。
    const list = await readJson(
      await app.request('/api/audit-logs?action=cashier_open', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(list.items).toHaveLength(1)
    expect(list.items[0]).toMatchObject({ id: body.id, action: 'cashier_open' })
    expect(list.pagination).toMatchObject({ page: 1, pageSize: 20, totalCount: 1, totalPages: 1 })
  })

  it('多筆紀錄依 id 由新到舊排序', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    for (const detail of ['第一筆', '第二筆', '第三筆']) {
      await app.request('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ action: 'cashier_open', operator: '店長 - Lemon', detail })
      })
    }
    const list = await readJson(
      await app.request('/api/audit-logs?action=cashier_open', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(list.items.map((row: { detail: string }) => row.detail)).toEqual([
      '第三筆',
      '第二筆',
      '第一筆'
    ])
  })
})

describe('POST /api/audit-logs（report.export）', () => {
  it('有 canCheckDataAnalysis 時允許，回傳 201', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const roleId = await seedRole(db, { capabilities: ['canCheckDataAnalysis'] })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId: null,
      name: '店長',
      jobTitle: '店長',
      account: `report-export-${staffId}`,
      roleId,
      pinHash: 'test-hash',
      pinSalt: 'test-salt'
    })
    const sessionToken = await issueTestSession(db, staffId)

    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        action: 'report.export',
        operator: '店長 - Lemon',
        detail: '匯出營運數據分析報表（統計期間：2026-01-01 ~ 2026-01-31）'
      })
    })
    expect(res.status).toBe(201)
  })

  it('沒有 canCheckDataAnalysis 時拒絕，回傳 403（跟 cashier_open 各自檢查各自所需的權限）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const roleId = await seedRole(db, { capabilities: ['canOpenCashier'] })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId: null,
      name: '工讀生',
      jobTitle: '工讀生',
      account: `no-analytics-${staffId}`,
      roleId,
      pinHash: 'test-hash',
      pinSalt: 'test-salt'
    })
    const sessionToken = await issueTestSession(db, staffId)

    const res = await app.request('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ action: 'report.export', operator: '工讀生', detail: '匯出報表' })
    })
    expect(res.status).toBe(403)
  })
})

describe('GET /api/audit-logs', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/audit-logs')
    expect(res.status).toBe(401)
  })

  it('裝置憑證有效但操作員沒有 canCheckAuditLog 權限時拒絕，回傳 403', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const roleId = await seedRole(db, { capabilities: [] })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId: null,
      name: '工讀生',
      jobTitle: '工讀生',
      account: `no-audit-access-${staffId}`,
      roleId,
      pinHash: 'test-hash',
      pinSalt: 'test-salt'
    })
    const sessionToken = await issueTestSession(db, staffId)

    const res = await app.request('/api/audit-logs', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(403)
  })

  it('可依 action／operator／關鍵字與日期區間篩選，並支援分頁', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    for (const detail of ['第一筆', '第二筆', '第三筆']) {
      await app.request('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ action: 'cashier_open', operator: '店長 - Lemon', detail })
      })
    }

    const filtered = await readJson(
      await app.request('/api/audit-logs?keyword=第二筆', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(filtered.items).toHaveLength(1)
    expect(filtered.items[0]).toMatchObject({ detail: '第二筆' })

    const paged = await readJson(
      await app.request('/api/audit-logs?action=cashier_open&page=1&pageSize=2', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(paged.items).toHaveLength(2)
    expect(paged.pagination).toMatchObject({ page: 1, pageSize: 2, totalCount: 3, totalPages: 2 })
  })
})
