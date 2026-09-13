import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq } from 'drizzle-orm'
import {
  createMemberRequestSchema,
  memberDetailSchema,
  memberSchema,
  updateMemberRequestSchema
} from '@pos/contract'
import { members, orders } from '../db/schema'
import { checkCapability, requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

/**
 * 會員管理 API：提供會員 CRUD 與消費紀錄查詢。
 *
 * 查看（列表、詳細資料＋消費紀錄）用 canCheckMembers；新增/編輯/刪除用
 * canManageMembers。列表原本沒有依手機號碼查詢時（後台「會員名單」整批
 * 撈出全部會員姓名＋電話）完全沒有權限檢查，任何裝置憑證都能撈出全店會員
 * 個資，因此改成依請求內容動態檢查：帶 phone 查單一會員（結帳當下查會員
 * 用，任何已登入操作員都能用）維持不用權限；沒帶 phone 等於整批撈會員名單，
 * 才需要 canCheckMembers，沒辦法用靜態 requireCapability() middleware。
 */
const errorSchema = z.object({ error: z.string() })

const listMembersRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: {
    // 支援依手機號碼精確查詢，供結帳流程快速檢索。
    query: z.object({ phone: z.string().min(1).optional() })
  },
  responses: {
    200: {
      description: '會員列表',
      content: { 'application/json': { schema: memberSchema.array() } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    403: {
      description: '沒帶 phone（整批撈會員名單）時，需要 canCheckMembers',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const createMemberRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: { body: { content: { 'application/json': { schema: createMemberRequestSchema } } } },
  responses: {
    201: { description: '會員建立成功', content: { 'application/json': { schema: memberSchema } } },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '這個手機號碼已經是會員',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const getMemberRoute = createRoute({
  method: 'get',
  path: '/{id}',
  // 詳細資料含完整消費紀錄，只有後台會員管理頁會用到，不像列表的單一手機
  // 號碼查詢有結帳流程要用，直接用靜態權限檢查。
  middleware: [requireDeviceToken, requireCapability('canCheckMembers')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: {
      description: '會員詳細資料＋消費紀錄',
      content: { 'application/json': { schema: memberDetailSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } }
  }
})

const updateMemberRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateMemberRequestSchema } } }
  },
  responses: {
    200: { description: '會員更新成功', content: { 'application/json': { schema: memberSchema } } },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個會員',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '這個手機號碼已經是別的會員',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteMemberRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '會員已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } }
  }
})

export const memberRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listMembersRoute, async (c) => {
    const { phone } = c.req.valid('query')
    if (!phone) {
      const capabilityCheck = await checkCapability(c, 'canCheckMembers')
      if (!capabilityCheck.ok)
        return c.json({ error: capabilityCheck.message }, capabilityCheck.status)
    }
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const tenantCond = tenantFilter(members.tenantId, tenantId)
    const rows = await db
      .select()
      .from(members)
      .where(phone ? and(eq(members.phone, phone), tenantCond) : tenantCond)
      .all()
    return c.json(rows, 200)
  })
  .openapi(createMemberRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(members)
      .where(and(eq(members.phone, input.phone), tenantFilter(members.tenantId, tenantId)))
      .get()
    if (existing) return c.json({ error: '這個手機號碼已經是會員' }, 409)
    const newMember = {
      id: crypto.randomUUID(),
      tenantId,
      ...input,
      points: 0,
      createdAt: new Date().toISOString()
    }
    await db.insert(members).values(newMember)
    return c.json(newMember, 201)
  })
  .openapi(getMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const member = await db
      .select()
      .from(members)
      .where(and(eq(members.id, id), tenantFilter(members.tenantId, tenantId)))
      .get()
    if (!member) return c.json({ error: '找不到這個會員' }, 404)
    const memberOrders = await db
      .select({
        orderId: orders.orderId,
        orderTime: orders.orderTime,
        orderStatus: orders.orderStatus,
        orderPaymentPrice: orders.orderPaymentPrice,
        pointsEarned: orders.pointsEarned
      })
      .from(orders)
      .where(eq(orders.memberId, id))
      .orderBy(desc(orders.orderTime))
      .all()
    return c.json({ ...member, orders: memberOrders }, 200)
  })
  .openapi(updateMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(members)
      .where(and(eq(members.id, id), tenantFilter(members.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    const phoneTaken = await db
      .select()
      .from(members)
      .where(and(eq(members.phone, input.phone), tenantFilter(members.tenantId, tenantId)))
      .get()
    if (phoneTaken && phoneTaken.id !== id)
      return c.json({ error: '這個手機號碼已經是別的會員' }, 409)
    await db.update(members).set(input).where(eq(members.id, id))
    return c.json({ ...existing, ...input }, 200)
  })
  .openapi(deleteMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(members)
      .where(and(eq(members.id, id), tenantFilter(members.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    // 訂單為交易憑證需保留，刪除會員時僅解除關聯（memberId 設為 null）。
    await db.update(orders).set({ memberId: null }).where(eq(orders.memberId, id))
    await db.delete(members).where(eq(members.id, id))
    return c.body(null, 204)
  })
