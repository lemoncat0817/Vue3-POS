import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createPaymentMethodRequestSchema, paymentMethodSchema, updatePaymentMethodRequestSchema } from '@pos/contract'
import { paymentMethods } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 付款方式管理（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。
 * permissionManagement.vue 原本的付款方式新增／編輯／刪除只改本機
 * Pinia 狀態，這裡補上對應的伺服端端點，寫法跟 promotions.ts 的
 * 折價券 CRUD 是同一套模式。
 */
const listPaymentMethodsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: { description: '付款方式清單', content: { 'application/json': { schema: z.array(paymentMethodSchema) } } },
  },
})

const createPaymentMethodRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createPaymentMethodRequestSchema } } } },
  responses: {
    201: { description: '付款方式建立成功', content: { 'application/json': { schema: paymentMethodSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updatePaymentMethodRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updatePaymentMethodRequestSchema } } },
  },
  responses: {
    200: { description: '付款方式更新成功', content: { 'application/json': { schema: paymentMethodSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個付款方式', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deletePaymentMethodRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '付款方式已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個付款方式', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const paymentMethodRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listPaymentMethodsRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(paymentMethods).all()
    return c.json(rows.map((row) => paymentMethodSchema.parse(row)), 200)
  })
  .openapi(createPaymentMethodRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newMethod = { id: crypto.randomUUID(), ...input }
    await db.insert(paymentMethods).values(newMethod)
    return c.json(newMethod, 201)
  })
  .openapi(updatePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個付款方式' }, 404)
    await db.update(paymentMethods).set(input).where(eq(paymentMethods.id, id))
    return c.json({ id, ...input }, 200)
  })
  .openapi(deletePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個付款方式' }, 404)
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id))
    return c.body(null, 204)
  })
