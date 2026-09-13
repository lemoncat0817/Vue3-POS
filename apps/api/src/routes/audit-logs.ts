import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm'
import {
  auditLogListResponseSchema,
  auditLogSchema,
  createAuditLogRequestSchema,
  listAuditLogsQuerySchema,
  type AuditLogAction,
  type AuthorityKey,
  type ListAuditLogsQuery
} from '@pos/contract'
import { auditLogs } from '../db/schema'
import { checkCapability, requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const REQUIRED_CAPABILITY_BY_ACTION: Partial<Record<AuditLogAction, AuthorityKey>> = {
  cashier_open: 'canOpenCashier',
  'report.export': 'canCheckDataAnalysis'
}

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
    401: { description: '裝置憑證無效或缺漏' },
    403: { description: '沒有對應動作所需的權限' }
  }
})

function buildAuditLogFilters(query: Pick<ListAuditLogsQuery, keyof ListAuditLogsQuery>) {
  const conditions = []
  if (query.keyword) {
    conditions.push(like(auditLogs.detail, `%${query.keyword}%`))
  }
  if (query.action) conditions.push(eq(auditLogs.action, query.action))
  if (query.operator) conditions.push(like(auditLogs.operator, `%${query.operator}%`))
  if (query.dateFrom) conditions.push(gte(auditLogs.createdAt, query.dateFrom))
  if (query.dateTo) conditions.push(lte(auditLogs.createdAt, `${query.dateTo}T23:59:59.999Z`))
  return conditions.length > 0 ? and(...conditions) : undefined
}

const listAuditLogsRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canCheckAuditLog')] as const,
  request: { query: listAuditLogsQuerySchema },
  responses: {
    200: {
      description: '稽核紀錄列表（分頁），最新的在前面',
      content: { 'application/json': { schema: auditLogListResponseSchema } }
    },
    401: { description: '裝置憑證無效或缺漏' },
    403: { description: '沒有查看操作紀錄的權限' }
  }
})

export const auditLogRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createAuditLogRoute, async (c) => {
    const input = c.req.valid('json')
    const requiredCapability = REQUIRED_CAPABILITY_BY_ACTION[input.action]
    if (!requiredCapability) {
      return c.json({ error: '這個動作不支援透過此端點寫入' }, 403)
    }
    const check = await checkCapability(c, requiredCapability)
    if (!check.ok) return c.json({ error: check.message }, check.status)

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
    const query = c.req.valid('query')
    const filters = buildAuditLogFilters(query)
    const where = filters
      ? and(filters, tenantFilter(auditLogs.tenantId, tenantId))
      : tenantFilter(auditLogs.tenantId, tenantId)

    const [totalRow, pageRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where).get(),
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .all()
    ])
    const totalCount = totalRow?.count ?? 0

    return c.json(
      {
        items: pageRows,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize))
        }
      },
      200
    )
  })
