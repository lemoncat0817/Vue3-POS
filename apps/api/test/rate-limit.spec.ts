import { sql } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

// 速率限制驗證：透過操作 rate_limit_counters 模擬計數器達標，避免實際發送大量請求。
describe('速率限制', () => {
  it('GET 端點不受限制，就算計數器已經爆表也一樣能查詢', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    await db.run(
      sql`insert into rate_limit_counters (key, window_start, count) values ('anonymous', ${Date.now()}, 9999)`
    )
    const res = await app.request('/api/catalog', { headers: { 'X-Device-Token': deviceToken } })
    expect(res.status).toBe(200)
  })

  it('寫入端點的計數器超過門檻時拒絕，回傳 429 並帶 Retry-After', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    // 直接把該裝置憑證 key 的計數器灌過門檻以觸發 429。
    await db.run(sql`
      insert into rate_limit_counters (key, window_start, count) values (${deviceToken}, ${Date.now()}, 1001)
      on conflict (key) do update set window_start = excluded.window_start, count = excluded.count
    `)

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '測試分類' })
    })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('視窗過期後，就算先前計數器已經爆表，一樣可以繼續寫入', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    // 視窗開始時間設在很久以前（超過 60 秒），下一次請求應該被視為
    // 新的視窗，計數器重置成 1，不會被擋。
    await db.run(sql`
      insert into rate_limit_counters (key, window_start, count) values (${deviceToken}, ${Date.now() - 120_000}, 9999)
      on conflict (key) do update set window_start = excluded.window_start, count = excluded.count
    `)

    const res = await app.request('/api/catalog/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ name: '測試分類2' })
    })
    expect(res.status).toBe(201)
  })
})
