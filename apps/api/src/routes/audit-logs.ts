import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { desc } from 'drizzle-orm'
import { auditLogSchema, createAuditLogRequestSchema } from '@pos/contract'
import { auditLogs } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

/** 稽核紀錄 API：記錄開錢箱等關鍵操作至伺服端資料庫。 */
const createAuditLogRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createAuditLogRequestSchema } } } },
  responses: {
    201: {
      description: '稽核紀錄已建立',
      content: { 'application/json': { schema: auditLogSchema } }
    },
    401: { description: '裝置憑證無效或缺漏' }
  }
})

const listAuditLogsRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '稽核紀錄列表，最新的在前面',
      content: { 'application/json': { schema: auditLogSchema.array() } }
    },
    401: { description: '裝置憑證無效或缺漏' }
  }
})

export const auditLogRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createAuditLogRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const createdAt = new Date().toISOString()
    const result = await db
      .insert(auditLogs)
      .values({ ...input, createdAt })
      .returning()
    return c.json(result[0], 201)
  })
  .openapi(listAuditLogsRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).all()
    return c.json(rows, 200)
  })
