import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createStaffRequestSchema, staffSchema, updateStaffRequestSchema } from '@pos/contract'
import { hashSecret } from '../auth/hash'
import { staff } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

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
  // 新增員工會異動權限名單，屬於需要裝置憑證的異動操作（見
  // src/middleware/require-device-token.ts 的說明）。掛在路由定義本身
  // 的 middleware，只套用在這一條路由，不影響上面的 GET。
  middleware: [requireDeviceToken] as const,
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
  },
})

/**
 * 編輯／刪除員工（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。
 * permissionManagement.vue 原本的編輯／刪除只改本機 Pinia 狀態，這裡
 * 補上對應的伺服端端點，理由跟 catalog.ts 的菜單管理寫入 API 一致。
 */
const updateStaffRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateStaffRequestSchema } } },
  },
  responses: {
    200: { description: '員工資料更新成功', content: { 'application/json': { schema: staffSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個員工', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這個帳號已經被其他員工使用', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteStaffRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '員工已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個員工', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const staffRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listStaffRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(staff).all()
    return c.json(
      rows.map((row) =>
        staffSchema.parse({
          id: row.id,
          name: row.name,
          jobTitle: row.jobTitle,
          account: row.account,
          capabilities: row.capabilities,
        }),
      ),
      200,
    )
  })
  .openapi(createStaffRoute, async (c) => {
    const { pin, ...input } = c.req.valid('json')
    const db = c.get('db')

    // PIN 只在這裡經手一次，雜湊後存進資料庫，明碼不落地（見
    // src/auth/hash.ts）。
    const { hash, salt } = await hashSecret(pin)
    const newStaff = {
      id: crypto.randomUUID(),
      ...input,
      pinHash: hash,
      pinSalt: salt,
      failedPinAttempts: 0,
      lockedUntil: null,
    }
    await db.insert(staff).values(newStaff)

    return c.json(staffSchema.parse(newStaff), 201)
  })
  .openapi(updateStaffRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { pin, ...input } = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(staff).where(eq(staff.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個員工' }, 404)

    const accountTaken = await db.select().from(staff).where(eq(staff.account, input.account)).get()
    if (accountTaken && accountTaken.id !== id) {
      return c.json({ error: '這個帳號已經被其他員工使用' }, 409)
    }

    // pin 選填——只有真的要重設 PIN 才重新雜湊，沒填就沿用既有的雜湊值
    // ／鹽（見 @pos/contract 的 updateStaffRequestSchema 說明）。
    const pinFields = pin ? await hashSecret(pin) : { hash: existing.pinHash, salt: existing.pinSalt }
    await db
      .update(staff)
      .set({ ...input, pinHash: pinFields.hash, pinSalt: pinFields.salt })
      .where(eq(staff.id, id))

    return c.json(staffSchema.parse({ id, ...input }), 200)
  })
  .openapi(deleteStaffRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(staff).where(eq(staff.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個員工' }, 404)
    await db.delete(staff).where(eq(staff.id, id))
    return c.body(null, 204)
  })
