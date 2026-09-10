import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/** 付款方式管理 API 測試。 */
describe('GET /api/payment-methods', () => {
  it('不需要裝置憑證即可查詢，沒有資料時回傳空陣列', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/payment-methods')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('付款方式寫入 API', () => {
  it('沒有裝置憑證時，新增拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '現金', disabled: false, useMethod: '紙鈔' }),
    })
    expect(res.status).toBe(401)
  })

  it('新增、編輯、刪除，異動反映在 GET 清單', async () => {
    const { app, deviceToken, staffId } = await createTestAppWithDevice(createTestDb())
    const created = await readJson(
      await app.request('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': staffId },
        body: JSON.stringify({ name: '現金', disabled: false, useMethod: '紙鈔' }),
      }),
    )
    expect(created).toMatchObject({ name: '現金', disabled: false, useMethod: '紙鈔' })

    const updateRes = await app.request(`/api/payment-methods/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': staffId },
      body: JSON.stringify({ name: '現金', disabled: true, useMethod: '紙鈔' }),
    })
    expect(updateRes.status).toBe(200)
    expect(await readJson(updateRes)).toMatchObject({ disabled: true })

    const list = await readJson(await app.request('/api/payment-methods'))
    expect(list).toEqual([{ id: created.id, name: '現金', disabled: true, useMethod: '紙鈔' }])

    const deleteRes = await app.request(`/api/payment-methods/${created.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Staff-Id': staffId },
    })
    expect(deleteRes.status).toBe(204)
    expect(await readJson(await app.request('/api/payment-methods'))).toEqual([])
  })

  it('找不到付款方式時，編輯／刪除都回傳 404', async () => {
    const { app, deviceToken, staffId } = await createTestAppWithDevice(createTestDb())
    const updateRes = await app.request('/api/payment-methods/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken, 'X-Staff-Id': staffId },
      body: JSON.stringify({ name: '現金', disabled: false, useMethod: '紙鈔' }),
    })
    expect(updateRes.status).toBe(404)

    const deleteRes = await app.request('/api/payment-methods/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Staff-Id': staffId },
    })
    expect(deleteRes.status).toBe(404)
  })
})
