import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm'
import {
  createMemberRequestSchema,
  listMembersQuerySchema,
  manualPointAdjustmentRequestSchema,
  memberDetailQuerySchema,
  memberDetailSchema,
  memberListResponseSchema,
  memberSchema,
  updateMemberRequestSchema
} from '@pos/contract'
import { members, memberPointLedger, orders } from '../db/schema'
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
    query: listMembersQuerySchema
  },
  responses: {
    200: {
      description: '分頁後的會員列表；帶 phone 查詢時 items 最多 1 筆',
      content: { 'application/json': { schema: memberListResponseSchema } }
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
  request: {
    params: z.object({ id: z.string().min(1) }),
    query: memberDetailQuerySchema
  },
  responses: {
    200: {
      description: '會員詳細資料＋分頁消費紀錄＋點數異動明細',
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

// 手動調整點數：客訴補償、活動加點等沒有對應訂單的異動，跟訂單自動累加/
// 收回一樣走 member_point_ledger，只是 reason 固定是 manual_adjustment、
// operator／note 有值。
const createPointsAdjustmentRoute = createRoute({
  method: 'post',
  path: '/{id}/points-adjustments',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: manualPointAdjustmentRequestSchema } } }
  },
  responses: {
    200: { description: '調整成功，回傳更新後的會員資料', content: { 'application/json': { schema: memberSchema } } },
    400: {
      description: '扣點會讓點數變成負值',
      content: { 'application/json': { schema: errorSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } }
  }
})

export const memberRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listMembersRoute, async (c) => {
    const { phone, q, page, pageSize } = c.req.valid('query')
    if (!phone) {
      const capabilityCheck = await checkCapability(c, 'canCheckMembers')
      if (!capabilityCheck.ok)
        return c.json({ error: capabilityCheck.message }, capabilityCheck.status)
    }
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    // 軟刪除的會員一律排除：整批清單不該看到、結帳查會員也不該查得到、
    // 更不該讓已刪除的會員被掛到新訂單上。
    const tenantCond = and(tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
    const where = phone
      ? and(eq(members.phone, phone), tenantCond)
      : q
        ? and(or(like(members.name, `%${q}%`), like(members.phone, `%${q}%`)), tenantCond)
        : tenantCond

    // phone 精確查詢頂多 1 筆，維持既有行為不分頁；後台名單／搜尋才真的
    // 用 count(*) ＋ limit/offset 分頁，避免會員一多整頁一次拉完。
    if (phone) {
      const rows = await db.select().from(members).where(where).all()
      return c.json(
        {
          items: rows,
          pagination: { page: 1, pageSize: Math.max(rows.length, 1), totalCount: rows.length, totalPages: 1 }
        },
        200
      )
    }

    const [totalRow, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(members).where(where).get(),
      db
        .select()
        .from(members)
        .where(where)
        .orderBy(desc(members.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()
    ])
    const totalCount = totalRow?.count ?? 0
    return c.json(
      {
        items: rows,
        pagination: { page, pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / pageSize)) }
      },
      200
    )
  })
  .openapi(createMemberRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    // 這裡故意不排除已軟刪除的會員：members_tenant_phone_idx 不是部分索引，
    // 被刪除會員的手機號碼在資料庫層仍然佔用著，如果這裡排除掉、判斷「可以
    // 用」，實際 INSERT 還是會撞唯一索引丟出沒處理過的錯誤，體驗比清楚的
    // 409 還差。
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
      createdAt: new Date().toISOString(),
      deletedAt: null
    }
    await db.insert(members).values(newMember)
    return c.json(newMember, 201)
  })
  .openapi(getMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { page, pageSize } = c.req.valid('query')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const member = await db
      .select()
      .from(members)
      .where(
        and(eq(members.id, id), tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
      )
      .get()
    if (!member) return c.json({ error: '找不到這個會員' }, 404)

    // 消費紀錄分頁：老會員訂單一多，整包吐回來畫面會整包渲染，改用跟
    // GET /api/members 一樣的 count(*) ＋ limit/offset 分頁。
    const ordersWhere = eq(orders.memberId, id)
    const [totalOrdersRow, memberOrders] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(orders).where(ordersWhere).get(),
      db
        .select({
          orderId: orders.orderId,
          orderTime: orders.orderTime,
          orderStatus: orders.orderStatus,
          orderPaymentPrice: orders.orderPaymentPrice,
          pointsEarned: orders.pointsEarned
        })
        .from(orders)
        .where(ordersWhere)
        .orderBy(desc(orders.orderTime))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()
    ])
    const totalOrders = totalOrdersRow?.count ?? 0

    const pointsLedger = await db
      .select({
        id: memberPointLedger.id,
        delta: memberPointLedger.delta,
        reason: memberPointLedger.reason,
        orderId: memberPointLedger.orderId,
        operator: memberPointLedger.operator,
        note: memberPointLedger.note,
        createdAt: memberPointLedger.createdAt
      })
      .from(memberPointLedger)
      .where(eq(memberPointLedger.memberId, id))
      .orderBy(desc(memberPointLedger.createdAt))
      .all()
    return c.json(
      {
        ...member,
        orders: {
          items: memberOrders,
          pagination: {
            page,
            pageSize,
            totalCount: totalOrders,
            totalPages: Math.max(1, Math.ceil(totalOrders / pageSize))
          }
        },
        pointsLedger
      },
      200
    )
  })
  .openapi(updateMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(members)
      .where(
        and(eq(members.id, id), tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
      )
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
      .where(
        and(eq(members.id, id), tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
      )
      .get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    // 軟刪除：orders.memberId、member_point_ledger.memberId 都不用再改寫，
    // 消費歷史與點數異動明細永遠留著正確的會員關聯，供之後稽核或申訴查證。
    await db
      .update(members)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(members.id, id))
    return c.body(null, 204)
  })
  .openapi(createPointsAdjustmentRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(members)
      .where(
        and(eq(members.id, id), tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
      )
      .get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    if (existing.points + input.delta < 0) {
      return c.json(
        { error: `扣點會讓點數變成負值（目前 ${existing.points} 點，欲扣 ${-input.delta} 點）` },
        400
      )
    }
    const nextPoints = existing.points + input.delta
    await db
      .update(members)
      .set({ points: sql`${members.points} + ${input.delta}` })
      .where(and(eq(members.id, id), tenantFilter(members.tenantId, tenantId)))
    await db.insert(memberPointLedger).values({
      id: crypto.randomUUID(),
      tenantId,
      memberId: id,
      delta: input.delta,
      reason: 'manual_adjustment',
      orderId: null,
      operator: input.operator,
      note: input.reason,
      createdAt: new Date().toISOString()
    })
    return c.json({ ...existing, points: nextPoints }, 200)
  })
