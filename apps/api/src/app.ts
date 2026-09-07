import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AnyDb } from './db/types'
import type { AppEnv } from './types'
import { catalogRoutes } from './routes/catalog'
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
export function createApp(db: AnyDb, config: { deviceToken: string }) {
  const app = new OpenAPIHono<AppEnv>()

  app.use('*', async (c, next) => {
    c.set('db', db)
    c.set('deviceToken', config.deviceToken)
    await next()
  })

  app.openapi(healthRoute, (c) => c.json({ ok: true as const }))

  app.route('/api/catalog', catalogRoutes)
  app.route('/api/orders', orderRoutes)
  app.route('/api/staff', staffRoutes)

  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'MAJI Tea POS API', version: '0.0.0' },
  })

  return app
}

export type App = ReturnType<typeof createApp>
