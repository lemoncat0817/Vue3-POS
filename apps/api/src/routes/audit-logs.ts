import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { desc } from 'drizzle-orm'
import { auditLogSchema, createAuditLogRequestSchema } from '@pos/contract'
import { auditLogs } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

/** 稽核紀錄 API：記錄開錢箱等關鍵操作至伺服端資料庫。 */
const createAuditLogRoute = createRoute({
  method: 'post',
  path: '/',
  // action 目前唯一的值是 cashier_open（沒有交易紀錄的開錢箱），前端按鈕
  // 靠 canOpenCashier 決定要不要 disable，但這支 API 本身原本沒有把關，
  // 直接呼叫就能繞過畫面禁用寫入一筆假的稽核紀錄，內控紀錄形同虛設。
  middleware: [requireDeviceToken, requireCapability('canOpenCashier')] as const,
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
    const tenantId = c.get('tenantId')
    const createdAt = new Date().toISOString()
    const result = await db
      .insert(auditLogs)
      .values({ ...input, tenantId, createdAt })
      .returning()
    return c.json(result[0], 201)
  })
  .openapi(listAuditLogsRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select()
      .from(auditLogs)
      .where(tenantFilter(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.id))
      .all()
    return c.json(rows, 200)
  })
