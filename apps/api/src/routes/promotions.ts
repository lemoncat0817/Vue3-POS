import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createMoneyCouponRequestSchema,
  createPercentCouponRequestSchema,
  createQuickDiscountRequestSchema,
  moneyCouponSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  quickDiscountSchema,
  updateQuickDiscountRequestSchema,
} from '@pos/contract'
import { moneyCoupons, percentCoupons, quickDiscounts } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const getPromotionsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '目前的促銷資料（現金／折數折價券、快速折扣）',
      content: { 'application/json': { schema: promotionsResponseSchema } },
    },
  },
})

const createMoneyCouponRoute = createRoute({
  method: 'post',
  path: '/money-coupons',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createMoneyCouponRequestSchema } } } },
  responses: {
    201: { description: '現金折價券建立成功', content: { 'application/json': { schema: moneyCouponSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteMoneyCouponRoute = createRoute({
  method: 'delete',
  path: '/money-coupons/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '現金折價券已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這張折價券', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateMoneyCouponRoute = createRoute({
  method: 'put',
  path: '/money-coupons/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: createMoneyCouponRequestSchema } } },
  },
  responses: {
    200: { description: '現金折價券更新成功', content: { 'application/json': { schema: moneyCouponSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這張折價券', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createPercentCouponRoute = createRoute({
  method: 'post',
  path: '/percent-coupons',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createPercentCouponRequestSchema } } } },
  responses: {
    201: { description: '折數折價券建立成功', content: { 'application/json': { schema: percentCouponSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deletePercentCouponRoute = createRoute({
  method: 'delete',
  path: '/percent-coupons/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '折數折價券已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這張折價券', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updatePercentCouponRoute = createRoute({
  method: 'put',
  path: '/percent-coupons/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: createPercentCouponRequestSchema } } },
  },
  responses: {
    200: { description: '折數折價券更新成功', content: { 'application/json': { schema: percentCouponSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這張折價券', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createQuickDiscountRoute = createRoute({
  method: 'post',
  path: '/quick-discounts',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createQuickDiscountRequestSchema } } } },
  responses: {
    201: { description: '快速折扣建立成功', content: { 'application/json': { schema: quickDiscountSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateQuickDiscountRoute = createRoute({
  method: 'put',
  path: '/quick-discounts/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateQuickDiscountRequestSchema } } },
  },
  responses: {
    200: { description: '快速折扣更新成功', content: { 'application/json': { schema: quickDiscountSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆快速折扣', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteQuickDiscountRoute = createRoute({
  method: 'delete',
  path: '/quick-discounts/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '快速折扣已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆快速折扣', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const promotionRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getPromotionsRoute, async (c) => {
    const db = c.get('db')
    const [money, percent, quick] = await Promise.all([
      db.select().from(moneyCoupons).all(),
      db.select().from(percentCoupons).all(),
      db.select().from(quickDiscounts).all(),
    ])

    return c.json(
      promotionsResponseSchema.parse({
        moneyCoupons: money.map((row) => ({ id: row.id, name: row.name, discountMoney: row.discountMoney })),
        percentCoupons: percent.map((row) => ({ id: row.id, name: row.name, discountPercent: row.discountPercent })),
        quickDiscounts: quick.map((row) => ({ id: row.id, name: row.name, kind: row.kind, value: row.value })),
      }),
      200,
    )
  })
  .openapi(createMoneyCouponRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newCoupon = { id: crypto.randomUUID(), ...input }
    await db.insert(moneyCoupons).values(newCoupon)
    return c.json(moneyCouponSchema.parse(newCoupon), 201)
  })
  .openapi(deleteMoneyCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(moneyCoupons).where(eq(moneyCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.delete(moneyCoupons).where(eq(moneyCoupons.id, id))
    return c.body(null, 204)
  })
  .openapi(updateMoneyCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(moneyCoupons).where(eq(moneyCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.update(moneyCoupons).set(input).where(eq(moneyCoupons.id, id))
    return c.json(moneyCouponSchema.parse({ id, ...input }), 200)
  })
  .openapi(createPercentCouponRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newCoupon = { id: crypto.randomUUID(), ...input }
    await db.insert(percentCoupons).values(newCoupon)
    return c.json(percentCouponSchema.parse(newCoupon), 201)
  })
  .openapi(deletePercentCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(percentCoupons).where(eq(percentCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.delete(percentCoupons).where(eq(percentCoupons.id, id))
    return c.body(null, 204)
  })
  .openapi(updatePercentCouponRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(percentCoupons).where(eq(percentCoupons.id, id)).get()
    if (!existing) return c.json({ error: '找不到這張折價券' }, 404)
    await db.update(percentCoupons).set(input).where(eq(percentCoupons.id, id))
    return c.json(percentCouponSchema.parse({ id, ...input }), 200)
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
