import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import type { AnyDb } from './db/types'
import type { AppEnv } from './types'
import { authRoutes } from './routes/auth'
import { catalogRoutes } from './routes/catalog'
import { deviceRoutes } from './routes/devices'
import { orderRoutes } from './routes/orders'
import { staffRoutes } from './routes/staff'

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
export function createApp(db: AnyDb, config: { provisioningSecret: string }) {
  const app = new OpenAPIHono<AppEnv>()

  // 單店單機使用（見規劃書 §1 的部署前提），前端（apps/pos）跟這個 API
  // 執行在不同 origin／port（GitHub Pages 靜態站 vs. Cloudflare
  // Workers），需要 CORS 才能跨源呼叫。這裡不是對外公開的多租戶 API，
  // 沒有 cookie-based session 要保護，允許任意 origin 讀取即可；真正的
  // 存取控制在 requireDeviceToken（見 middleware/require-device-token.ts）。
  app.use(
    '*',
    cors({ origin: '*', allowHeaders: ['Content-Type', 'X-Device-Token', 'X-Provisioning-Secret'] }),
  )

  app.use('*', async (c, next) => {
    c.set('db', db)
    c.set('provisioningSecret', config.provisioningSecret)
    await next()
  })

  app.openapi(healthRoute, (c) => c.json({ ok: true as const }))

  app.route('/api/auth', authRoutes)
  app.route('/api/catalog', catalogRoutes)
  app.route('/api/devices', deviceRoutes)
  app.route('/api/orders', orderRoutes)
  app.route('/api/staff', staffRoutes)

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'MAJI Tea POS API', version: '0.0.0' },
  })

  return app
}

export type App = ReturnType<typeof createApp>
