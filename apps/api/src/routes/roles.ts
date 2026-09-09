import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createRoleRequestSchema, roleSchema, updateRoleRequestSchema, type AuthorityKey } from '@pos/contract'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 權限群組（角色）管理 API。權限只掛在角色身上，員工只認 roleId——見
 * db/schema.ts 的說明。這裡額外把關兩件事：
 * 1. 系統內建角色（isSystem）不可刪除、不可改名，但權限內容仍可調整。
 * 2. 任何異動都不可讓「擁有 canSetAuthority 的員工人數」歸零，否則全店
 *    會沒有人能再打開權限管理頁面救援——取代舊版用 jobTitle==='店長'
 *    字串比對的脆弱保護。
 */
async function wouldLeaveNoAuthorityAdmin(
  db: AnyDb,
  roleIdBeingChanged: string,
  nextCapabilities: AuthorityKey[],
): Promise<boolean> {
  const allRoles = await db.select().from(roles).all()
  const allStaff = await db.select({ roleId: staff.roleId }).from(staff).all()
  const capabilitiesById = new Map(allRoles.map((role) => [role.id, role.capabilities]))
  const currentlyHasAdmin = allStaff.some((row) => capabilitiesById.get(row.roleId)?.includes('canSetAuthority'))
  // 系統本來就沒有人擁有這個權限（例如全新環境還沒指派任何管理者），
  // 不是這次變更造成的，不擋——只防「從有變沒有」這個轉折。
  if (!currentlyHasAdmin) return false

  capabilitiesById.set(roleIdBeingChanged, nextCapabilities)
  return !allStaff.some((row) => capabilitiesById.get(row.roleId)?.includes('canSetAuthority'))
}

const listRolesRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: { description: '權限群組清單', content: { 'application/json': { schema: z.array(roleSchema) } } },
  },
})

const createRoleRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createRoleRequestSchema } } } },
  responses: {
    201: { description: '權限群組建立成功', content: { 'application/json': { schema: roleSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '名稱已被使用', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateRoleRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateRoleRequestSchema } } },
  },
  responses: {
    200: { description: '權限群組更新成功', content: { 'application/json': { schema: roleSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個權限群組', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '名稱已被使用，或此變更會讓沒有人擁有權限管理能力', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteRoleRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '權限群組已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個權限群組', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '系統內建角色不可刪除，或仍有員工使用此角色', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const roleRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listRolesRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(roles).all()
    return c.json(rows.map((row) => roleSchema.parse(row)), 200)
  })
  .openapi(createRoleRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')

    const nameTaken = await db.select().from(roles).where(eq(roles.name, input.name)).get()
    if (nameTaken) return c.json({ error: '此名稱已被使用，請重新輸入' }, 409)

    const newRole = { id: crypto.randomUUID(), ...input, isSystem: false }
    await db.insert(roles).values(newRole)
    return c.json(roleSchema.parse(newRole), 201)
  })
  .openapi(updateRoleRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(roles).where(eq(roles.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個權限群組' }, 404)

    if (existing.isSystem && input.name !== existing.name) {
      return c.json({ error: '系統內建角色不可改名' }, 409)
    }
    const nameTaken = await db.select().from(roles).where(eq(roles.name, input.name)).get()
    if (nameTaken && nameTaken.id !== id) {
      return c.json({ error: '此名稱已被使用，請重新輸入' }, 409)
    }
    if (await wouldLeaveNoAuthorityAdmin(db, id, input.capabilities)) {
      return c.json({ error: '此變更會讓沒有人擁有「設定人員名單」的權限，操作已取消' }, 409)
    }

    await db.update(roles).set(input).where(eq(roles.id, id))
    return c.json(roleSchema.parse({ id, ...input, isSystem: existing.isSystem }), 200)
  })
  .openapi(deleteRoleRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')

    const existing = await db.select().from(roles).where(eq(roles.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個權限群組' }, 404)
    if (existing.isSystem) return c.json({ error: '系統內建角色不可刪除' }, 409)

    const inUse = await db.select().from(staff).where(eq(staff.roleId, id)).get()
    if (inUse) return c.json({ error: '仍有員工使用此角色，請先改指到其他角色' }, 409)

    await db.delete(roles).where(eq(roles.id, id))
    return c.body(null, 204)
  })
