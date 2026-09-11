import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createOrderCouponRequestSchema,
  createQuickDiscountRequestSchema,
  orderCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  updateOrderCouponRequestSchema,
  updateQuickDiscountRequestSchema
} from '@pos/contract'
import { orderCoupons, quickDiscounts } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const getPromotionsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '目前的促銷資料（訂單折價券、快速折扣）',
      content: { 'application/json': { schema: promotionsResponseSchema } }
    }
  }
})

const createOrderCouponRoute = createRoute({
  method: 'post',
  path: '/order-coupons',
  middleware: [requireDeviceToken, requireCapability('canSetOrderCoupon')] as const,
  request: {
    body: { content: { 'application/json': { schema: createOrderCouponRequestSchema } } }
  },
  responses: {
    201: {
      description: '訂單折價券建立成功',
      content: { 'application/json': { schema: orderCouponSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateOrderCouponRoute = createRoute({
  method: 'put',
  path: '/order-coupons/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetOrderCoupon')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateOrderCouponRequestSchema } } }
  },
  responses: {
    200: {
      description: '訂單折價券更新成功',
      content: { 'application/json': { schema: orderCouponSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這張折價券',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteOrderCouponRoute = createRoute({
  method: 'delete',
  path: '/order-coupons/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetOrderCoupon')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '訂單折價券已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這張折價券',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const createQuickDiscountRoute = createRoute({
  method: 'post',
  path: '/quick-discounts',
  middleware: [requireDeviceToken, requireCapability('canSetQuickDiscount')] as const,
  request: {
    body: { content: { 'application/json': { schema: createQuickDiscountRequestSchema } } }
  },
  responses: {
    201: {
      description: '快速折扣建立成功',
      content: { 'application/json': { schema: quickDiscountSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const updateQuickDiscountRoute = createRoute({
  method: 'put',
  path: '/quick-discounts/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetQuickDiscount')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateQuickDiscountRequestSchema } } }
  },
  responses: {
    200: {
      description: '快速折扣更新成功',
      content: { 'application/json': { schema: quickDiscountSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這筆快速折扣',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const deleteQuickDiscountRoute = createRoute({
  method: 'delete',
  path: '/quick-discounts/{id}',
  middleware: [requireDeviceToken, requireCapability('canSetQuickDiscount')] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '快速折扣已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這筆快速折扣',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const promotionRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getPromotionsRoute, async (c) => {
    const db = c.get('db')
    const [coupons, quick] = await Promise.all([
      db.select().from(orderCoupons).all(),
      db.select().from(quickDiscounts).all()
    ])

    return c.json(
      promotionsResponseSchema.parse({
        orderCoupons: coupons.map((row) => ({
          id: row.id,
          name: row.name,
          kind: row.kind,
          value: row.value
        })),
        quickDiscounts: quick.map((row) => ({
          id: row.id,
          name: row.name,
          kind: row.kind,
          value: row.value
        }))
      }),
      200
    )
  })
  .openapi(createOrderCouponRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newCoupon = { id: crypto.randomUUID(), ...input }
    await db.insert(orderCoupons).values(newCoupon)
    return c.json(orderCouponSchema.parse(newCoupon), 201)
  })
  .openapi(updateOrderCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(orderCoupons).where(eq(orderCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.update(orderCoupons).set(input).where(eq(orderCoupons.id, id))
    return c.json(orderCouponSchema.parse({ id, ...input }), 200)
  })
  .openapi(deleteOrderCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(orderCoupons).where(eq(orderCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.delete(orderCoupons).where(eq(orderCoupons.id, id))
    return c.body(null, 204)
  })
  .openapi(createQuickDiscountRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newDiscount = { id: crypto.randomUUID(), ...input }
    await db.insert(quickDiscounts).values(newDiscount)
    return c.json(quickDiscountSchema.parse(newDiscount), 201)
  })
  .openapi(updateQuickDiscountRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(quickDiscounts).where(eq(quickDiscounts.id, id)).get()
    if (!existing) return c.json({ error: '找不到這筆快速折扣' }, 404)
    await db.update(quickDiscounts).set(input).where(eq(quickDiscounts.id, id))
    return c.json(quickDiscountSchema.parse({ id, ...input }), 200)
  })
  .openapi(deleteQuickDiscountRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(quickDiscounts).where(eq(quickDiscounts.id, id)).get()
    if (!existing) return c.json({ error: '找不到這筆快速折扣' }, 404)
    await db.delete(quickDiscounts).where(eq(quickDiscounts.id, id))
    return c.body(null, 204)
  })
