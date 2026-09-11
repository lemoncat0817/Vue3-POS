import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'
import { operatorSessions } from '../src/db/schema'
import type { AnyDb } from '../src/db/types'

async function createStaff(
  db: AnyDb,
  app: Awaited<ReturnType<typeof createTestAppWithDevice>>['app'],
  deviceToken: string,
  sessionToken: string
) {
  const roleId = await seedRole(db, { capabilities: ['canCheckOrder'] })
  await app.request('/api/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    },
    body: JSON.stringify({
      name: 'Emily',
      jobTitle: '工讀生',
      account: 'emily',
      roleId,
      pin: '3456'
    })
  })
}

describe('POST /api/auth/operator-login', () => {
  it('沒有裝置憑證時拒絕，回傳 401（PIN 這麼短，不能讓任何用戶端直接暴力猜）', async () => {
    const { app } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: 'emily', pin: '3456' })
    })
    expect(res.status).toBe(401)
  })

  it('帳號與 PIN 都正確時登入成功，回傳員工資料（不含 PIN）與一組新的 session token', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken, sessionToken)

    const res = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '3456' })
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({ name: 'Emily', account: 'emily', capabilities: ['canCheckOrder'] })
    expect(body).not.toHaveProperty('pin')
    expect(body).not.toHaveProperty('pinHash')
    expect(typeof body.sessionToken).toBe('string')
    expect((body.sessionToken as string).length).toBeGreaterThan(0)
    // 每次登入都是新的一組，不是沿用呼叫端自己帶的 X-Operator-Session。
    expect(body.sessionToken).not.toBe(sessionToken)
  })

  it('帳號不存在跟 PIN 錯誤回傳一樣的錯誤訊息，不洩漏帳號是否存在', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken, sessionToken)

    const wrongPin = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '0000' })
    })
    const noSuchAccount = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'does-not-exist', pin: '0000' })
    })

    expect(wrongPin.status).toBe(401)
    expect(noSuchAccount.status).toBe(401)
    expect(await wrongPin.json()).toEqual(await noSuchAccount.json())
  })

  it('連續輸入錯誤達上限後鎖定帳號，即使之後輸入正確的 PIN 也會被拒絕', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken, sessionToken)

    const attemptWrongPin = () =>
      app.request('/api/auth/operator-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ account: 'emily', pin: '0000' })
      })

    for (let i = 0; i < 5; i++) {
      const res = await attemptWrongPin()
      expect(res.status).toBe(401)
    }

    const lockedRes = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '3456' }) // 正確的 PIN
    })
    expect(lockedRes.status).toBe(401)
    expect(await lockedRes.json()).toMatchObject({ error: expect.stringContaining('鎖定') })
  })

  it('登入成功會重置先前累積的錯誤次數', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await createStaff(db, app, deviceToken, sessionToken)

    await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '0000' })
    })
    const success = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '3456' })
    })
    expect(success.status).toBe(200)
  })
})

describe('POST /api/auth/logout', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const { app } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/auth/logout', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('沒有帶 X-Operator-Session 時拒絕，回傳 400', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(400)
  })

  it('登出後這組 session 就不能再用來通過權限檢查', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(logout.status).toBe(204)

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })

  it('查無此 session 或已撤銷都視為成功（冪等），回傳 204', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': 'does-not-exist' }
    })
    expect(res.status).toBe(204)
  })
})

describe('操作員 session 過期', () => {
  it('過了 expiresAt 之後，即使沒被撤銷也不能再用來通過權限檢查', async () => {
    const db = createTestDb()
    const { app, deviceToken, staffId, sessionToken } = await createTestAppWithDevice(db)

    // 直接把這組 session 的效期改到過去，模擬「已核發但過期」的狀態，
    // 不用真的等 12 小時。
    await db
      .update(operatorSessions)
      .set({ expiresAt: '2000-01-01T00:00:00.000Z' })
      .where(eq(operatorSessions.staffId, staffId))

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '主餐' })
    })
    expect(res.status).toBe(401)
  })
})
