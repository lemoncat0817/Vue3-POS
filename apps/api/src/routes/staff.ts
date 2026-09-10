import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createStaffRequestSchema, staffSchema, updateStaffRequestSchema } from '@pos/contract'
import { hashSecret } from '../auth/hash'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/** 依 roleId 解析出 roleName／capabilities，組成回應用的 staffSchema 形狀。 */
async function toStaffResponse(
  db: AnyDb,
  row: { id: string; name: string; jobTitle: string; account: string; roleId: string },
) {
  const role = await db.select().from(roles).where(eq(roles.id, row.roleId)).get()
  if (!role) throw new Error(`staff ${row.id} 指向不存在的 roleId ${row.roleId}`)
  return staffSchema.parse({
    id: row.id,
    name: row.name,
    jobTitle: row.jobTitle,
    account: row.account,
    roleId: role.id,
    roleName: role.name,
    capabilities: role.capabilities,
  })
}

/** 判斷「若把某員工的角色改成 nextRoleId」之後，是否還有人擁有 canManageRoles——
 * 這是唯一會造成永久鎖死的能力，理由見 routes/roles.ts 同名函式。 */
async function wouldLeaveNoRoleAdmin(
  db: AnyDb,
  staffIdBeingChanged: string | null,
  nextRoleId: string | null,
): Promise<boolean> {
  const allRoles = await db.select().from(roles).all()
  const allStaff = await db.select({ id: staff.id, roleId: staff.roleId }).from(staff).all()
  const capabilitiesOf = (roleId: string) => allRoles.find((role) => role.id === roleId)?.capabilities ?? []

  const currentlyHasAdmin = allStaff.some((row) => capabilitiesOf(row.roleId).includes('canManageRoles'))
  // 系統本來就沒有人擁有這個權限，不是這次變更造成的，不擋——只防「從有變沒有」這個轉折。
  if (!currentlyHasAdmin) return false

  return !allStaff.some((row) => {
    if (row.id === staffIdBeingChanged) {
      return nextRoleId !== null && capabilitiesOf(nextRoleId).includes('canManageRoles')
    }
    return capabilitiesOf(row.roleId).includes('canManageRoles')
  })
}

const listStaffRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '員工名單',
      content: { 'application/json': { schema: z.array(staffSchema) } },
    },
  },
})

const createStaffRoute = createRoute({
  method: 'post',
  path: '/',
  // 建立員工屬異動操作，需校驗裝置憑證。
  middleware: [requireDeviceToken, requireCapability('canManageStaff')] as const,
  request: {
    body: { content: { 'application/json': { schema: createStaffRequestSchema } } },
  },
  responses: {
    201: {
      description: '員工建立成功',
      content: { 'application/json': { schema: staffSchema } },
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
    404: { description: '指定的權限群組不存在', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '帳號已被使用', content: { 'application/json': { schema: errorSchema } } },
  },
})

/** 員工管理寫入 API：支援後台編輯與刪除員工。 */
const updateStaffRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageStaff')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateStaffRequestSchema } } },
  },
  responses: {
    200: { description: '員工資料更新成功', content: { 'application/json': { schema: staffSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個員工，或指定的權限群組不存在', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這個帳號已經被其他員工使用，或此變更會讓沒有人擁有權限管理能力', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteStaffRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageStaff')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '員工已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個員工', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '此操作會讓沒有人擁有權限管理能力', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const staffRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listStaffRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(staff).all()
    const responses = await Promise.all(rows.map((row) => toStaffResponse(db, row)))
    return c.json(responses, 200)
  })
  .openapi(createStaffRoute, async (c) => {
    const { pin, roleId, ...input } = c.req.valid('json')
    const db = c.get('db')

    const role = await db.select().from(roles).where(eq(roles.id, roleId)).get()
    if (!role) return c.json({ error: '指定的權限群組不存在' }, 404)

    const accountTaken = await db.select().from(staff).where(eq(staff.account, input.account)).get()
    if (accountTaken) return c.json({ error: '這個帳號已經被使用' }, 409)

    // PIN 只在這裡經手一次，雜湊後存進資料庫，明碼不落地（見
    // src/auth/hash.ts）。
    const { hash, salt } = await hashSecret(pin)
    const newStaff = {
      id: crypto.randomUUID(),
      ...input,
      roleId,
      pinHash: hash,
      pinSalt: salt,
      failedPinAttempts: 0,
      lockedUntil: null,
    }
    await db.insert(staff).values(newStaff)

    return c.json(await toStaffResponse(db, newStaff), 201)
  })
  .openapi(updateStaffRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { pin, roleId, ...input } = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(staff).where(eq(staff.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個員工' }, 404)

    const role = await db.select().from(roles).where(eq(roles.id, roleId)).get()
    if (!role) return c.json({ error: '指定的權限群組不存在' }, 404)

    const accountTaken = await db.select().from(staff).where(eq(staff.account, input.account)).get()
    if (accountTaken && accountTaken.id !== id) {
      return c.json({ error: '這個帳號已經被其他員工使用' }, 409)
    }
    if (await wouldLeaveNoRoleAdmin(db, id, roleId)) {
      return c.json({ error: '此變更會讓沒有人擁有「設定權限群組」的權限，操作已取消' }, 409)
    }

    // pin 選填——只有真的要重設 PIN 才重新雜湊，沒填就沿用既有的雜湊值
    // ／鹽（見 @pos/contract 的 updateStaffRequestSchema 說明）。
    const pinFields = pin ? await hashSecret(pin) : { hash: existing.pinHash, salt: existing.pinSalt }
    await db
      .update(staff)
      .set({ ...input, roleId, pinHash: pinFields.hash, pinSalt: pinFields.salt })
      .where(eq(staff.id, id))

    return c.json(await toStaffResponse(db, { id, ...input, roleId }), 200)
  })
  .openapi(deleteStaffRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(staff).where(eq(staff.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個員工' }, 404)
    if (await wouldLeaveNoRoleAdmin(db, id, null)) {
      return c.json({ error: '此操作會讓沒有人擁有「設定權限群組」的權限，操作已取消' }, 409)
    }
    await db.delete(staff).where(eq(staff.id, id))
    return c.body(null, 204)
  })
