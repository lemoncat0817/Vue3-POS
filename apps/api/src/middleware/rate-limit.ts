import { createMiddleware } from 'hono/factory'
import { sql } from 'drizzle-orm'
import type { AppEnv } from '../types'

/**
 * 寫入請求速率限制（每分鐘上限 1000 次，防範自動化濫用；GET 唯讀端點不限）。
 * 辨識鍵依序取裝置憑證、核發密鑰或來源 IP。
 */
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 1000

export const rateLimit = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.method === 'GET') {
    await next()
    return
  }

  const key =
    c.req.header('X-Device-Token') ?? c.req.header('X-Provisioning-Secret') ?? c.req.header('CF-Connecting-IP') ?? 'anonymous'
  const now = Date.now()
  const db = c.get('db')

  // 以單一 UPSERT 原子更新計數器與視窗時間，避免併發競態。
  const row = await db.get<{ count: number; windowStart: number }>(sql`
    insert into rate_limit_counters (key, window_start, count)
    values (${key}, ${now}, 1)
    on conflict (key) do update set
      count = case when ${now} - window_start >= ${WINDOW_MS} then 1 else count + 1 end,
      window_start = case when ${now} - window_start >= ${WINDOW_MS} then ${now} else window_start end
    returning count, window_start
  `)

  if (row && row.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((row.windowStart + WINDOW_MS - now) / 1000))
    c.header('Retry-After', String(retryAfterSeconds))
    return c.json({ error: '請求過於頻繁，請稍後再試' }, 429)
  }

  await next()
})
