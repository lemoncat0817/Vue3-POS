import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

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

    const list = await readJson(
      await app.request('/api/audit-logs', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: body.id, action: 'cashier_open' })
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
      await app.request('/api/audit-logs', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(list.map((row: { detail: string }) => row.detail)).toEqual([
      '第三筆',
      '第二筆',
      '第一筆'
    ])
  })
})

describe('GET /api/audit-logs', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/audit-logs')
    expect(res.status).toBe(401)
  })
})
