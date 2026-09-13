import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import {
  createPaymentMethodRequestSchema,
  paymentMethodSchema,
  updatePaymentMethodRequestSchema
} from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { paymentMethods } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/** 付款方式管理 API：支援後台付款方式設定之 CRUD。 */
const listPaymentMethodsRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '付款方式清單',
      content: { 'application/json': { schema: z.array(paymentMethodSchema) } }
    }
  }
})

const createPaymentMethodRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canSetPayMethod')] as const,
  request: {
    body: { content: { 'application/json': { schema: createPaymentMethodRequestSchema } } }
  },
  responses: {
    201: {
      description: '付款方式建立成功',
      content: { 'application/json': { schema: paymentMethodSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updatePaymentMethodRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetPayMethod')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updatePaymentMethodRequestSchema } } }
  },
  responses: {
    200: {
      description: '付款方式更新成功',
      content: { 'application/json': { schema: paymentMethodSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個付款方式',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deletePaymentMethodRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetPayMethod')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '付款方式已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個付款方式',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const paymentMethodRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listPaymentMethodsRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select()
      .from(paymentMethods)
      .where(tenantFilter(paymentMethods.tenantId, tenantId))
      .all()
    return c.json(
      rows.map((row) => paymentMethodSchema.parse(row)),
      200
    )
  })
  .openapi(createPaymentMethodRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const newMethod = { id: crypto.randomUUID(), tenantId, ...input }
    await db.insert(paymentMethods).values(newMethod)
    await recordAuditLog(c, 'paymentMethod.create', `新增付款方式「${input.name}」`)
    return c.json(newMethod, 201)
  })
  .openapi(updatePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), tenantFilter(paymentMethods.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個付款方式' }, 404)
    await db.update(paymentMethods).set(input).where(eq(paymentMethods.id, id))
    await recordAuditLog(
      c,
      'paymentMethod.update',
      `更新付款方式「${existing.name}」→「${input.name}」`
    )
    return c.json({ id, ...input }, 200)
  })
  .openapi(deletePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), tenantFilter(paymentMethods.tenantId, tenantId)))
      .get()
    if (!existing) return c.json({ error: '找不到這個付款方式' }, 404)
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id))
    await recordAuditLog(c, 'paymentMethod.delete', `刪除付款方式「${existing.name}」`)
    return c.body(null, 204)
  })
