import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import {
  createMemberTierRequestSchema,
  memberTierSchema,
  updateMemberTierRequestSchema
} from '@pos/contract'
import { memberTiers } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/** 會員分級門檻管理 API：業主自訂「累積消費滿多少元升到哪一級」，CRUD 比照 payment-methods.ts。 */
const listMemberTiersRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '會員分級門檻清單',
      content: { 'application/json': { schema: z.array(memberTierSchema) } }
    }
  }
})

const createMemberTierRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: { body: { content: { 'application/json': { schema: createMemberTierRequestSchema } } } },
  responses: {
    201: { description: '分級門檻建立成功', content: { 'application/json': { schema: memberTierSchema } } },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateMemberTierRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateMemberTierRequestSchema } } }
  },
  responses: {
    200: { description: '分級門檻更新成功', content: { 'application/json': { schema: memberTierSchema } } },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個分級門檻',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteMemberTierRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageMembers')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '分級門檻已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個分級門檻',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const memberTierRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listMemberTiersRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select()
      .from(memberTiers)
      .where(tenantFilter(memberTiers.tenantId, tenantId))
      .all()
    return c.json(
      rows.map((row) => memberTierSchema.parse(row)),
      200
    )
  })
  .openapi(createMemberTierRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const newTier = { id: crypto.randomUUID(), tenantId, ...input }
    await db.insert(memberTiers).values(newTier)
    return c.json(newTier, 201)
  })
  .openapi(updateMemberTierRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(memberTiers)
      .where(and(eq(memberTiers.id, id), tenantFilter(memberTiers.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個分級門檻' }, 404)
    await db.update(memberTiers).set(input).where(eq(memberTiers.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deleteMemberTierRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(memberTiers)
      .where(and(eq(memberTiers.id, id), tenantFilter(memberTiers.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個分級門檻' }, 404)
    await db.delete(memberTiers).where(eq(memberTiers.id, id))
    return c.body(null, 204)
  })
