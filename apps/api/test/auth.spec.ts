import { describe, expect, it } from 'vitest'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'
import type { AnyDb } from '../src/db/types'

async function createStaff(db: AnyDb, app: Awaited<ReturnType<typeof createTestAppWithDevice>>['app'], deviceToken: string) {
  const roleId = await seedRole(db, { capabilities: ['canCheckOrder'] })
  await app.request('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
    body: JSON.stringify({ name: 'Emily', jobTitle: '工讀生', account: 'emily', roleId, pin: '3456' }),
  })
}

describe('POST /api/auth/operator-login', () => {
  it('沒有裝置憑證時拒絕，回傳 401（PIN 這麼短，不能讓任何用戶端直接暴力猜）', async () => {
    const { app } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: 'emily', pin: '3456' }),
    })
    expect(res.status).toBe(401)
  })

  it('帳號與 PIN 都正確時登入成功，回傳員工資料（不含 PIN）', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken)

    const res = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '3456' }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({ name: 'Emily', account: 'emily', capabilities: ['canCheckOrder'] })
    expect(body).not.toHaveProperty('pin')
    expect(body).not.toHaveProperty('pinHash')
  })

  it('帳號不存在跟 PIN 錯誤回傳一樣的錯誤訊息，不洩漏帳號是否存在', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken)

    const wrongPin = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '0000' }),
    })
    const noSuchAccount = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'does-not-exist', pin: '0000' }),
    })

    expect(wrongPin.status).toBe(401)
    expect(noSuchAccount.status).toBe(401)
    expect(await wrongPin.json()).toEqual(await noSuchAccount.json())
  })

  it('連續輸入錯誤達上限後鎖定帳號，即使之後輸入正確的 PIN 也會被拒絕', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken)

    const attemptWrongPin = () =>
      app.request('/api/auth/operator-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ account: 'emily', pin: '0000' }),
      })

    for (let i = 0; i < 5; i++) {
      const res = await attemptWrongPin()
      expect(res.status).toBe(401)
    }

    const lockedRes = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '3456' }), // 正確的 PIN
    })
    expect(lockedRes.status).toBe(401)
    expect(await lockedRes.json()).toMatchObject({ error: expect.stringContaining('鎖定') })
  })

  it('登入成功會重置先前累積的錯誤次數', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken)

    await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '0000' }),
    })
    const success = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '3456' }),
    })
    expect(success.status).toBe(200)
  })
})
