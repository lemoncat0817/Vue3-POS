import { createMiddleware } from 'hono/factory'
import { sql } from 'drizzle-orm'
import type { AppEnv } from '../types'

/**
 * 速率限制（P21：規劃書 §10 P21「API 安全加固」）。單店單機情境下
 * 正常使用量很低，這裡的門檻是為了擋自動化濫用（例如對退款／作廢／
 * 登入端點寫腳本連續打），不是為了限制真人操作。
 *
 * 只限制會改變資料的請求（POST/PUT/PATCH/DELETE）：GET 端點本來就是
 * 唯讀，也是 App.vue 開機同步菜單／促銷／付款方式／人員名單（見
 * apps/pos/src/App.vue）的請求量大宗，限制唯讀端點沒有防護意義，只
 * 會誤傷正常使用。
 *
 * key 依序取裝置憑證、核發密鑰、來源 IP，最後才退回一個固定值——
 * 前三種都是目前這個 request 已經帶的識別資訊，不需要另外解析；本機
 * 開發／測試環境常常沒有 CF-Connecting-IP（那是 Cloudflare 邊緣網路
 * 才會加上的表頭），所有本機請求因此會共用同一把 key，這是刻意的
 * 保守選擇（寧可本機開發時彼此互相影響配額，也不要正式環境沒有真的
 * 限到任何人）——這也代表單一裝置憑證的配額是整台終端機共用的，不是
 * 每個端點各自一份。
 *
 * 門檻訂在每分鐘 1000 次寫入：曾經先訂在 100，結果 `pnpm run
 * test:e2e` 整個 e2e 套件（單一裝置憑證跑完 30 幾個測試案例、上百次
 * 寫入請求）本身的正常請求量在短時間內重複執行兩次就會撞到門檻，回
 * 429——這不是「測試環境需要放寬」的特例，是門檻訂得比一台真正終端
 * 機在尖峰時段可能的操作量還低，才會被自己的測試套件撞到。1000/分鐘
 * （約每秒 16 次）仍然遠低於腳本化暴力嘗試的量級，同時不會誤傷真人
 * 操作或 CI 重複執行整個測試套件。
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

  // 單一 UPSERT 而不是「先讀再判斷再寫」：視窗過期就重置成 1，否則
  // count + 1，全部包在同一個 SQL 語句裡原子完成，避免兩個幾乎同時
  // 送達的請求各自讀到重置前的舊值、都以為自己還在門檻內（跟
  // routes/orders.ts 的 nextOrderSequence／nextInvoiceNumber 是同一種
  // 「用資料庫的 upsert 本身保證原子性」考量）。
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
