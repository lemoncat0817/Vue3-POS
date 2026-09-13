import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq, inArray, isNull, like, ne, or, sql } from 'drizzle-orm'
import {
  createMemberRequestSchema,
  listMembersQuerySchema,
  manualPointAdjustmentRequestSchema,
  memberAnalyticsSchema,
  memberBirthdayEntrySchema,
  memberBirthdaysQuerySchema,
  memberDetailQuerySchema,
  memberDetailSchema,
  memberListResponseSchema,
  memberSchema,
  updateMemberRequestSchema,
  type Member,
  type MemberTier,
  type MemberTierStatus
} from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { members, memberPointLedger, memberTiers, orders } from '../db/schema'
import { checkCapability, requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { maybeExpireMemberPoints } from '../db/member-points'
import type { AnyDb } from '../db/types'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

function pickTier(tiers: MemberTier[], lifetimeSpend: number): MemberTier | null {
  const qualified = tiers
    .filter((tier) => lifetimeSpend >= tier.minSpend)
    .sort((a, b) => b.minSpend - a.minSpend)
  return qualified[0] ?? null
}

async function resolveLifetimeSpends(
  db: AnyDb,
  memberIds: string[]
): Promise<Map<string, number>> {
  if (memberIds.length === 0) return new Map()
  const rows = await db
    .select({ memberId: orders.memberId, total: sql<number>`sum(${orders.orderPaymentPrice})` })
    .from(orders)
    .where(and(inArray(orders.memberId, memberIds), ne(orders.orderStatus, '已取消')))
    .groupBy(orders.memberId)
    .all()
  const map = new Map<string, number>()
  for (const row of rows) {
    if (row.memberId) map.set(row.memberId, row.total)
  }
  return map
}

async function attachTierStatus<T extends Member>(
  db: AnyDb,
  tenantId: string | null,
  rows: T[]
): Promise<(T & { tierStatus: MemberTierStatus })[]> {
  const tiers = await db
    .select()
    .from(memberTiers)
    .where(tenantFilter(memberTiers.tenantId, tenantId))
    .all()
  const spendByMember = await resolveLifetimeSpends(
    db,
    rows.map((row) => row.id)
  )
  return rows.map((row) => {
    const lifetimeSpend = spendByMember.get(row.id) ?? 0
    return { ...row, tierStatus: { tier: pickTier(tiers, lifetimeSpend), lifetimeSpend } }
  })
}

async function attachTierStatusOne<T extends Member>(
  db: AnyDb,
  tenantId: string | null,
  row: T
): Promise<T & { tierStatus: MemberTierStatus }> {
  const [withTier] = await attachTierStatus(db, tenantId, [row])
  return withTier as T & { tierStatus: MemberTierStatus }
}
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

const listMemberBirthdaysRoute = createRoute({
  method: 'get',
  path: '/birthdays',
  middleware: [requireDeviceToken, requireCapability('canCheckMembers')] as const,
  request: { query: memberBirthdaysQuerySchema },
  responses: {
    200: {
      description: '指定月份壽星名單，依日期排序',
      content: { 'application/json': { schema: memberBirthdayEntrySchema.array() } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    403: {
      description: '沒有 canCheckMembers',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const getMemberAnalyticsRoute = createRoute({
  method: 'get',
  path: '/analytics',
  middleware: [requireDeviceToken, requireCapability('canCheckMembers')] as const,
  responses: {
    200: {
      description: '會員經營摘要',
      content: { 'application/json': { schema: memberAnalyticsSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    403: {
      description: '沒有 canCheckMembers',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const getMemberRoute = createRoute({
  method: 'get',
  path: '/{id}',
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
    const tenantCond = and(tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))
    const where = phone
      ? and(eq(members.phone, phone), tenantCond)
      : q
        ? and(or(like(members.name, `%${q}%`), like(members.phone, `%${q}%`)), tenantCond)
        : tenantCond

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
    const itemsWithTier = await attachTierStatus(db, tenantId, rows)
    return c.json(
      {
        items: itemsWithTier,
        pagination: { page, pageSize, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / pageSize)) }
      },
      200
    )
  })
  .openapi(createMemberRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    // 檢查重覆時不排除軟刪除列，因資料庫唯一索引未排除 deletedAt
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
      birthday: input.birthday ?? null,
      tags: input.tags ?? [],
      notes: input.notes ?? null,
      points: 0,
      createdAt: new Date().toISOString(),
      deletedAt: null
    }
    await db.insert(members).values(newMember)
    await recordAuditLog(c, 'member.create', `新增會員「${input.name}」（${input.phone}）`)
    return c.json(newMember, 201)
  })
  .openapi(listMemberBirthdaysRoute, async (c) => {
    const { month } = c.req.valid('query')
    const targetMonth = month ?? String(new Date().getMonth() + 1).padStart(2, '0')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select({ id: members.id, name: members.name, phone: members.phone, birthday: members.birthday })
      .from(members)
      .where(
        and(
          tenantFilter(members.tenantId, tenantId),
          isNull(members.deletedAt),
          sql`substr(${members.birthday}, 6, 2) = ${targetMonth}`
        )
      )
      .all()
    const sorted = [...rows]
      .filter((row): row is typeof row & { birthday: string } => row.birthday !== null)
      .sort((a, b) => a.birthday.slice(8, 10).localeCompare(b.birthday.slice(8, 10)))
    return c.json(sorted, 200)
  })
  .openapi(getMemberAnalyticsRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const activeCond = and(tenantFilter(members.tenantId, tenantId), isNull(members.deletedAt))

    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const [totalMembersRow, newMembersRow, memberRevenueRow, totalRevenueRow, activeMembers, tiers] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(members).where(activeCond).get(),
        db
          .select({ count: sql<number>`count(*)` })
          .from(members)
          .where(and(activeCond, sql`${members.createdAt} >= ${monthStart}`))
          .get(),
        db
          .select({ total: sql<number>`sum(${orders.orderPaymentPrice})` })
          .from(orders)
          .where(and(tenantFilter(orders.tenantId, tenantId), sql`${orders.memberId} is not null`, ne(orders.orderStatus, '已取消')))
          .get(),
        db
          .select({ total: sql<number>`sum(${orders.orderPaymentPrice})` })
          .from(orders)
          .where(and(tenantFilter(orders.tenantId, tenantId), ne(orders.orderStatus, '已取消')))
          .get(),
        db.select({ id: members.id }).from(members).where(activeCond).all(),
        db.select().from(memberTiers).where(tenantFilter(memberTiers.tenantId, tenantId)).all()
      ])

    const spendByMember = await resolveLifetimeSpends(
      db,
      activeMembers.map((row) => row.id)
    )
    const countByTierId = new Map<string | null, number>()
    for (const member of activeMembers) {
      const tier = pickTier(tiers, spendByMember.get(member.id) ?? 0)
      const key = tier?.id ?? null
      countByTierId.set(key, (countByTierId.get(key) ?? 0) + 1)
    }
    const tierDistribution = [
      ...tiers
        .slice()
        .sort((a, b) => b.minSpend - a.minSpend)
        .map((tier) => ({
          tierId: tier.id,
          tierName: tier.name,
          memberCount: countByTierId.get(tier.id) ?? 0
        })),
      { tierId: null, tierName: '一般會員', memberCount: countByTierId.get(null) ?? 0 }
    ]

    return c.json(
      {
        totalMembers: totalMembersRow?.count ?? 0,
        newMembersThisMonth: newMembersRow?.count ?? 0,
        memberRevenue: memberRevenueRow?.total ?? 0,
        totalRevenue: totalRevenueRow?.total ?? 0,
        tierDistribution
      },
      200
    )
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

    member.points = await maybeExpireMemberPoints(db, tenantId, member)

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
    const memberWithTier = await attachTierStatusOne(db, tenantId, member)
    return c.json(
      {
        ...memberWithTier,
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
    const patch = {
      ...input,
      birthday: input.birthday ?? null,
      tags: input.tags ?? [],
      notes: input.notes ?? null
    }
    await db.update(members).set(patch).where(eq(members.id, id))
    await recordAuditLog(c, 'member.update', `更新會員「${existing.name}」→「${input.name}」`)
    return c.json({ ...existing, ...patch }, 200)
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
    await db
      .update(members)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(members.id, id))
    await recordAuditLog(c, 'member.delete', `刪除會員「${existing.name}」（${existing.phone}）`)
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
    await recordAuditLog(
      c,
      'member.pointsAdjust',
      `調整會員「${existing.name}」點數 ${input.delta > 0 ? '+' : ''}${input.delta}（原因：${input.reason}）`
    )
    return c.json({ ...existing, points: nextPoints }, 200)
  })
