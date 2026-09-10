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
import { roleRoutes } from './routes/roles'
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

/** 建立 Hono 應用程式。由呼叫端傳入 Drizzle db 實例以相容 D1 與測試環境。 */
export function createApp(db: AnyDb, config: { provisioningSecret: string; allowedOrigins: string[] }) {
  const app = new OpenAPIHono<AppEnv>()

  // CORS 限制僅允許白名單來源，避免萬用字元 '*' 放大攻擊面。
  app.use(
    '*',
    cors({
      origin: config.allowedOrigins,
      allowHeaders: ['Content-Type', 'X-Device-Token', 'X-Provisioning-Secret', 'X-Operator-Session'],
    }),
  )

  app.use('*', async (c, next) => {
    c.set('db', db)
    c.set('provisioningSecret', config.provisioningSecret)
    await next()
  })

  // 速率限制需在 db 注入 context 後執行（計數器持久化於資料庫）。
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
  app.route('/api/roles', roleRoutes)
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
