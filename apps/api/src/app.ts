import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import type { AnyDb } from './db/types'
import type { AppEnv } from './types'
import { rateLimit } from './middleware/rate-limit'
import { auditLogRoutes } from './routes/audit-logs'
import { authRoutes } from './routes/auth'
import { catalogRoutes } from './routes/catalog'
import { deviceRoutes } from './routes/devices'
import { invoiceRoutes } from './routes/invoices'
import { memberRoutes } from './routes/members'
import { orderRoutes } from './routes/orders'
import { paymentMethodRoutes } from './routes/payment-methods'
import { promotionRoutes } from './routes/promotions'
import { reportRoutes } from './routes/reports'
import { shiftRoutes } from './routes/shifts'
import { staffRoutes } from './routes/staff'
import { tableRoutes } from './routes/tables'

export type { AppEnv }

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      description: '服務正常',
      content: {
        'application/json': {
          schema: z.object({ ok: z.literal(true) }),
        },
      },
    },
  },
})

/**
 * 建立 Hono 應用程式。刻意不在這裡直接建立 db 實例，而是由呼叫端
 * （Worker 入口的 src/index.ts，或測試用的 test/helpers/db.ts）決定要
 * 傳入 D1 還是 better-sqlite3 版本的 Drizzle 實例——路由本身不需要知道
 * 底層是哪個 driver（見 db/client.ts 的說明）。
 */
export function createApp(db: AnyDb, config: { provisioningSecret: string; allowedOrigins: string[] }) {
  const app = new OpenAPIHono<AppEnv>()

  // 單店單機使用（見規劃書 §1 的部署前提），前端（apps/pos）跟這個 API
  // 執行在不同 origin／port（GitHub Pages 靜態站 vs. Cloudflare
  // Workers），需要 CORS 才能跨源呼叫。
  //
  // P21（規劃書 §10 P21「API 安全加固」）：這裡原本是 `origin: '*'`，
  // 理由是「沒有 cookie-based session 要保護」——但 `origin: '*'` 允許
  // 的不只是「讀」，任何網站都能讓使用者的瀏覽器帶著使用者不知情的
  // 請求打進這個 API（雖然 requireDeviceToken 會擋掉沒有裝置憑證的
  // 寫入，但裝置憑證存在 apps/pos 的前端環境變數裡，惡意頁面理論上
  // 還是能透過使用者已開著的 POS 分頁發起同源請求，`*` 沒有必要地
  // 放寬了攻擊面）。改成白名單只允許 apps/pos 實際部署的來源，
  // allowedOrigins 由 index.ts 從 ALLOWED_ORIGINS 環境變數（見
  // env.ts）解析，本機測試則由 test/helpers/app.ts 帶入固定清單。
  app.use(
    '*',
    cors({ origin: config.allowedOrigins, allowHeaders: ['Content-Type', 'X-Device-Token', 'X-Provisioning-Secret'] }),
  )

  app.use('*', async (c, next) => {
    c.set('db', db)
    c.set('provisioningSecret', config.provisioningSecret)
    await next()
  })

  // P21：速率限制，見 middleware/rate-limit.ts 的完整說明。放在 db
  // 綁進 context 之後，因為計數器本身存在 D1。
  app.use('*', rateLimit)

  app.openapi(healthRoute, (c) => c.json({ ok: true as const }))

  app.route('/api/auth', authRoutes)
  app.route('/api/audit-logs', auditLogRoutes)
  app.route('/api/catalog', catalogRoutes)
  app.route('/api/devices', deviceRoutes)
  app.route('/api/invoices', invoiceRoutes)
  app.route('/api/members', memberRoutes)
  app.route('/api/orders', orderRoutes)
  app.route('/api/payment-methods', paymentMethodRoutes)
  app.route('/api/promotions', promotionRoutes)
  app.route('/api/reports', reportRoutes)
  app.route('/api/shifts', shiftRoutes)
  app.route('/api/staff', staffRoutes)
  app.route('/api/tables', tableRoutes)

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'POS API', version: '0.0.0' },
  })

  return app
}

export type App = ReturnType<typeof createApp>
