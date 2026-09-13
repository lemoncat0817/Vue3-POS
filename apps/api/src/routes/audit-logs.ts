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

/**
 * 這幾個 action 前端是在成功完成當下才主動呼叫這支公開端點寫入（不像
 * 其餘 action 是後端業務路由處理成功後自動呼叫 audit/record.ts 的
 * recordAuditLog()），所需權限要看 action 才能決定，沒辦法用靜態的
 * requireCapability() middleware（比照 orders.ts 的 updateOrderStatusRoute）。
 * cashier_open 只有 openCashier() 這個呼叫端，需要 canOpenCashier；
 * report.export 是數據分析頁「匯出 Excel」成功後呼叫，需要 canCheckDataAnalysis
 * ——報表匯出把營收/折扣/退款這類業務敏感數據帶出系統，防的是資料外流，
 * 得留下「誰、何時匯出」的紀錄，屬於業界常見的稽核項目。
 */
const REQUIRED_CAPABILITY_BY_ACTION: Partial<Record<AuditLogAction, AuthorityKey>> = {
  cashier_open: 'canOpenCashier',
  'report.export': 'canCheckDataAnalysis'
}

/** 稽核紀錄 API：記錄人員/權限/裝置、後台設定、會員、桌況、訂單作廢/退款/刪除、班別與現金異動等關鍵操作至伺服端資料庫。 */
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
    // 其餘 action（各業務路由自動寫入的那些）不會經過這支公開端點，
    // 查不到對應權限一律拒絕，避免之後新增 action 忘了在上面補權限對照。
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
