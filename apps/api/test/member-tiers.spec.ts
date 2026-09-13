import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/** 會員分級門檻管理 API 測試。 */
describe('GET /api/member-tiers', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/member-tiers')
    expect(res.status).toBe(401)
  })

  it('帶裝置憑證即可查詢，沒有資料時回傳空陣列', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb(), 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/member-tiers', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('會員分級門檻寫入 API', () => {
  it('沒有裝置憑證時，新增拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/member-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '金卡會員', minSpend: 10000 })
    })
    expect(res.status).toBe(401)
  })

  it('新增、編輯、刪除，異動反映在 GET 清單', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const created = await readJson(
      await app.request('/api/member-tiers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '金卡會員', minSpend: 10000 })
      })
    )
    expect(created).toMatchObject({ name: '金卡會員', minSpend: 10000 })

    const updateRes = await app.request(`/api/member-tiers/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '金卡會員', minSpend: 15000 })
    })
    expect(updateRes.status).toBe(200)
    expect(await readJson(updateRes)).toMatchObject({ minSpend: 15000 })

    const list = await readJson(
      await app.request('/api/member-tiers', { headers: { 'X-Device-Token': deviceToken } })
    )
    expect(list).toEqual([{ id: created.id, name: '金卡會員', minSpend: 15000 }])

    const deleteRes = await app.request(`/api/member-tiers/${created.id}`, {
      method: 'DELETE',
      headers
    })
    expect(deleteRes.status).toBe(204)
    expect(
      await readJson(
        await app.request('/api/member-tiers', { headers: { 'X-Device-Token': deviceToken } })
      )
    ).toEqual([])
  })

  it('找不到分級門檻時，編輯／刪除都回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const updateRes = await app.request('/api/member-tiers/does-not-exist', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '金卡會員', minSpend: 10000 })
    })
    expect(updateRes.status).toBe(404)

    const deleteRes = await app.request('/api/member-tiers/does-not-exist', {
      method: 'DELETE',
      headers
    })
    expect(deleteRes.status).toBe(404)
  })
})
