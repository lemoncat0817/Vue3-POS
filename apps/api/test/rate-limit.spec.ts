import { sql } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

/**
 * P21 迴歸驗證（規劃書 §10 P21「API 安全加固」）：見
 * middleware/rate-limit.ts 的完整說明。門檻是 1000 次／分鐘，這裡不會
 * 真的送超過一千次請求去撞門檻（太慢也沒必要），改成直接操作
 * rate_limit_counters 表，把某把 key 的計數器灌到門檻，驗證下一次
 * 請求會被擋、且視窗過期後又能正常使用。
 */
describe('速率限制（P21：規劃書 §10 P21「API 安全加固」）', () => {
  it('GET 端點不受限制，就算計數器已經爆表也一樣能查詢', async () => {
    const db = createTestDb()
    const app = createTestApp(db)
    await db.run(sql`insert into rate_limit_counters (key, window_start, count) values ('anonymous', ${Date.now()}, 9999)`)
    const res = await app.request('/api/catalog')
    expect(res.status).toBe(200)
  })

  it('寫入端點的計數器超過門檻時拒絕，回傳 429 並帶 Retry-After', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    // createTestAppWithDevice 建立裝置那一次請求已經佔用了 1 次額度，
    // 直接把同一把 key（裝置憑證本身）的計數器灌到門檻之上。
    await db.run(sql`
      insert into rate_limit_counters (key, window_start, count) values (${deviceToken}, ${Date.now()}, 1001)
      on conflict (key) do update set window_start = excluded.window_start, count = excluded.count
    `)

    const res = await app.request('/api/catalog/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '測試類型', type: 'testType' }),
    })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('視窗過期後，就算先前計數器已經爆表，一樣可以繼續寫入', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    // 視窗開始時間設在很久以前（超過 60 秒），下一次請求應該被視為
    // 新的視窗，計數器重置成 1，不會被擋。
    await db.run(sql`
      insert into rate_limit_counters (key, window_start, count) values (${deviceToken}, ${Date.now() - 120_000}, 9999)
      on conflict (key) do update set window_start = excluded.window_start, count = excluded.count
    `)

    const res = await app.request('/api/catalog/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '測試類型2', type: 'testType2' }),
    })
    expect(res.status).toBe(201)
  })
})
