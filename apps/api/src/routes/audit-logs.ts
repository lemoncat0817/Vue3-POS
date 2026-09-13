import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm'
import {
  auditLogListResponseSchema,
  auditLogSchema,
  createAuditLogRequestSchema,
  listAuditLogsQuerySchema,
  type ListAuditLogsQuery
} from '@pos/contract'
import { auditLogs } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

/** 稽核紀錄 API：記錄人員/權限/裝置、後台設定、會員、桌況、訂單作廢/退款/刪除、班別與現金異動等關鍵操作至伺服端資料庫。 */
const createAuditLogRoute = createRoute({
  method: 'post',
  path: '/',
  // 目前只有前端 openCashier() 這一個呼叫端（action 固定為 cashier_open），
  // 其餘 action 一律由各業務路由呼叫 audit/record.ts 的 recordAuditLog()
  // 直接寫入資料庫，不經過這支公開端點。canOpenCashier 是這個唯一呼叫端
  // 所需的權限；前端按鈕靠它決定要不要 disable，但這支 API 本身原本沒有
  // 把關，直接呼叫就能繞過畫面禁用寫入一筆假的稽核紀錄，內控紀錄形同虛設。
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

function buildAuditLogFilters(query: Pick<ListAuditLogsQuery, keyof ListAuditLogsQuery>) {
  const conditions = []
  if (query.keyword) {
    conditions.push(like(auditLogs.detail, `%${query.keyword}%`))
  }
  if (query.action) conditions.push(eq(auditLogs.action, query.action))
  if (query.operator) conditions.push(like(auditLogs.operator, `%${query.operator}%`))
  if (query.dateFrom) conditions.push(gte(auditLogs.createdAt, query.dateFrom))
  // createdAt 是含時間的 ISO 字串，dateTo 只有日期，補到當天最後一毫秒才
  // 不會把 dateTo 當天的紀錄排除在篩選範圍外（比照 orders.ts 的 buildOrderFilters）。
  if (query.dateTo) conditions.push(lte(auditLogs.createdAt, `${query.dateTo}T23:59:59.999Z`))
  return conditions.length > 0 ? and(...conditions) : undefined
}

const listAuditLogsRoute = createRoute({
  method: 'get',
  path: '/',
  // 會揭露全店人員/權限/訂單作廢等異動細節，原本完全沒有能力把關，任何
  // 已核發裝置都能讀到，補上 canCheckAuditLog。
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
