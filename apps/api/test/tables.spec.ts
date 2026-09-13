import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

describe('POST /api/tables', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
    })
    expect(res.status).toBe(401)
  })

  it('新增成功，id 由伺服端配發、預設為空桌', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
    })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toMatchObject({ tableNumber: 'A1', seats: 4, status: 'empty', note: '' })
    expect(typeof body.id).toBe('string')
    expect(body.id.length).toBeGreaterThan(0)
  })
})

describe('GET /api/tables', () => {
  it('可以列出所有桌位', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    await app.request('/api/tables', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
    })
    await app.request('/api/tables', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tableNumber: 'A2', seats: 2 })
    })
    const res = await app.request('/api/tables', {
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(200)
    const list = await readJson(res)
    expect(list).toHaveLength(2)
  })
})

describe('PATCH /api/tables/:id/status', () => {
  it('可以把空桌標成使用中，帶入備註', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const res = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'occupied', note: '4 位客人，帶位 14:00' })
    })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body).toMatchObject({ status: 'occupied', note: '4 位客人，帶位 14:00' })
  })

  it('切換狀態時沒帶 note，維持原本的備註不被清空', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'occupied', note: '4 位客人' })
    })
    const res = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'empty' })
    })
    const body = await readJson(res)
    expect(body).toMatchObject({ status: 'empty', note: '4 位客人' })
  })

  it('轉成使用中會自動蓋入座時間、可以帶用餐人數；維持使用中重存不會重蓋入座時間', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const firstRes = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'occupied', guestCount: 3 })
    })
    const first = await readJson(firstRes)
    expect(first.guestCount).toBe(3)
    expect(typeof first.occupiedAt).toBe('string')

    const secondRes = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'occupied', guestCount: 5 })
    })
    const second = await readJson(secondRes)
    expect(second.guestCount).toBe(5)
    expect(second.occupiedAt).toBe(first.occupiedAt)
  })

  it('轉成已預約可以帶聯絡電話與預約時間；轉回空桌會清空人數／入座時間／預約資訊', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const reservedRes = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'reserved',
        reservationPhone: '0912345678',
        reservationTime: '2026-09-13T10:00:00.000Z'
      })
    })
    const reserved = await readJson(reservedRes)
    expect(reserved).toMatchObject({
      reservationPhone: '0912345678',
      reservationTime: '2026-09-13T10:00:00.000Z',
      guestCount: null,
      occupiedAt: null
    })

    const emptyRes = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'empty' })
    })
    const empty = await readJson(emptyRes)
    expect(empty).toMatchObject({
      guestCount: null,
      occupiedAt: null,
      reservationPhone: null,
      reservationTime: null
    })
  })

  it('聯絡電話格式不對時拒絕，回傳 400', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const res = await app.request(`/api/tables/${table.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'reserved', reservationPhone: '不是電話' })
    })
    expect(res.status).toBe(400)
  })

  it('找不到桌位時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/tables/does-not-exist/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ status: 'occupied' })
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/tables/:id', () => {
  it('可以更新桌號與座位數', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const res = await app.request(`/api/tables/${table.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ tableNumber: 'A1-新', seats: 6 })
    })
    expect(res.status).toBe(200)
    expect(await readJson(res)).toMatchObject({ tableNumber: 'A1-新', seats: 6 })
  })
})

describe('DELETE /api/tables/:id', () => {
  it('刪除成功回傳 204，之後查詢列表看不到這個桌位', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    const res = await app.request(`/api/tables/${table.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(204)
    const list = await readJson(
      await app.request('/api/tables', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    )
    expect(list).toHaveLength(0)
  })

  it('找不到桌位時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/tables/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(404)
  })
})
