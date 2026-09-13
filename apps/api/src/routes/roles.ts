import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import {
  AUTHORITY_KEY_LABELS,
  createRoleRequestSchema,
  roleSchema,
  updateRoleRequestSchema,
  type AuthorityKey
} from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

// 防止擁有的 canManageRoles 管理人數歸零導致永久無法管理
async function wouldLeaveNoRoleAdmin(
  db: AnyDb,
  tenantId: string | null,
  roleIdBeingChanged: string,
  nextCapabilities: AuthorityKey[]
): Promise<boolean> {
  const allRoles = await db.select().from(roles).where(tenantFilter(roles.tenantId, tenantId)).all()
  const allStaff = await db
    .select({ roleId: staff.roleId })
    .from(staff)
    .where(tenantFilter(staff.tenantId, tenantId))
    .all()
  const capabilitiesById = new Map(allRoles.map((role) => [role.id, role.capabilities]))
  const currentlyHasAdmin = allStaff.some((row) =>
    capabilitiesById.get(row.roleId)?.includes('canManageRoles')
  )
  if (!currentlyHasAdmin) return false

  capabilitiesById.set(roleIdBeingChanged, nextCapabilities)
  return !allStaff.some((row) => capabilitiesById.get(row.roleId)?.includes('canManageRoles'))
}

function capabilityLabelsText(capabilities: AuthorityKey[]): string {
  return capabilities.map((key) => AUTHORITY_KEY_LABELS[key]).join('、') || '無'
}

const listRolesRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '權限群組清單',
      content: { 'application/json': { schema: z.array(roleSchema) } }
    }
  }
})

const createRoleRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canManageRoles')] as const,
  request: { body: { content: { 'application/json': { schema: createRoleRequestSchema } } } },
  responses: {
    201: {
      description: '權限群組建立成功',
      content: { 'application/json': { schema: roleSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: { description: '名稱已被使用', content: { 'application/json': { schema: errorSchema } } }
  }
})

const updateRoleRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageRoles')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateRoleRequestSchema } } }
  },
  responses: {
    200: {
      description: '權限群組更新成功',
      content: { 'application/json': { schema: roleSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個權限群組',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '名稱已被使用，或此變更會讓沒有人擁有權限管理能力',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteRoleRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageRoles')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '權限群組已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個權限群組',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '系統內建角色不可刪除，或仍有員工使用此角色',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const roleRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listRolesRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db.select().from(roles).where(tenantFilter(roles.tenantId, tenantId)).all()
    return c.json(
      rows.map((row) => roleSchema.parse(row)),
      200
    )
  })
  .openapi(createRoleRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const nameTaken = await db
      .select()
      .from(roles)
      .where(and(eq(roles.name, input.name), tenantFilter(roles.tenantId, tenantId)))
      .get()
    if (nameTaken) return c.json({ error: '此名稱已被使用，請重新輸入' }, 409)

    const newRole = { id: crypto.randomUUID(), tenantId, ...input, isSystem: false }
    await db.insert(roles).values(newRole)
    await recordAuditLog(
      c,
      'role.create',
      `新增權限群組「${input.name}」（能力：${capabilityLabelsText(input.capabilities)}）`
    )
    return c.json(roleSchema.parse(newRole), 201)
  })
  .openapi(updateRoleRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), tenantFilter(roles.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個權限群組' }, 404)

    if (existing.isSystem && input.name !== existing.name) {
      return c.json({ error: '系統內建角色不可改名' }, 409)
    }
    const nameTaken = await db
      .select()
      .from(roles)
      .where(and(eq(roles.name, input.name), tenantFilter(roles.tenantId, tenantId)))
      .get()
    if (nameTaken && nameTaken.id !== id) {
      return c.json({ error: '此名稱已被使用，請重新輸入' }, 409)
    }
    if (await wouldLeaveNoRoleAdmin(db, tenantId, id, input.capabilities)) {
      return c.json({ error: '此變更會讓沒有人擁有「設定權限群組」的權限，操作已取消' }, 409)
    }

    await db.update(roles).set(input).where(eq(roles.id, id))
    await recordAuditLog(
      c,
      'role.update',
      `更新權限群組「${input.name}」（能力：${capabilityLabelsText(input.capabilities)}）`
    )
    return c.json(roleSchema.parse({ id, ...input, isSystem: existing.isSystem }), 200)
  })
  .openapi(deleteRoleRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), tenantFilter(roles.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個權限群組' }, 404)
    if (existing.isSystem) return c.json({ error: '系統內建角色不可刪除' }, 409)

    const inUse = await db.select().from(staff).where(eq(staff.roleId, id)).get()
    if (inUse) return c.json({ error: '仍有員工使用此角色，請先改指到其他角色' }, 409)

    await db.delete(roles).where(eq(roles.id, id))
    await recordAuditLog(c, 'role.delete', `刪除權限群組「${existing.name}」`)
    return c.body(null, 204)
  })
