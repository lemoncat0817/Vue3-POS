import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createMoneyCouponRequestSchema,
  createPercentCouponRequestSchema,
  moneyCouponSchema,
  oftenUseRateSchema,
  percentCouponSchema,
  promotionsResponseSchema,
  updateOftenUseRateRequestSchema,
} from '@pos/contract'
import { moneyCoupons, oftenUseRates, percentCoupons } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const getPromotionsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '目前的促銷資料（現金／折數折價券、常用折扣）',
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

// 常用折扣固定 5 筆（slot 0～4），只能編輯內容，見 db/schema.ts 的說明。
const updateOftenUseRateRoute = createRoute({
  method: 'put',
  path: '/often-use-rates/{slot}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ slot: z.coerce.number().int().min(0).max(4) }),
    body: { content: { 'application/json': { schema: updateOftenUseRateRequestSchema } } },
  },
  responses: {
    200: { description: '常用折扣更新成功', content: { 'application/json': { schema: oftenUseRateSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '這個 slot 不存在', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const promotionRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getPromotionsRoute, async (c) => {
    const db = c.get('db')
    const [money, percent, oftenUse] = await Promise.all([
      db.select().from(moneyCoupons).all(),
      db.select().from(percentCoupons).all(),
      db.select().from(oftenUseRates).all(),
    ])

    const bySlot = new Map(oftenUse.map((row) => [row.slot, row]))
    const at = (slot: number) => {
      const row = bySlot.get(slot)
      if (!row) throw new Error(`常用折扣缺少 slot ${slot} 的資料，請先套用 seed/promotions.sql`)
      return { slot: row.slot, name: row.name, discountMoney: row.discountMoney, discountPercent: row.discountPercent }
    }

    return c.json(
      promotionsResponseSchema.parse({
        moneyCoupons: money.map((row) => ({ id: row.id, name: row.name, discountMoney: row.discountMoney })),
        percentCoupons: percent.map((row) => ({ id: row.id, name: row.name, discountPercent: row.discountPercent })),
        oftenUseRates: [at(0), at(1), at(2), at(3), at(4)],
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
  .openapi(updateOftenUseRateRoute, async (c) => {
    const { slot } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(oftenUseRates).where(eq(oftenUseRates.slot, slot)).get()
    if (!existing) return c.json({ error: '這個 slot 不存在' }, 404)
    await db.update(oftenUseRates).set(input).where(eq(oftenUseRates.slot, slot))
    return c.json(oftenUseRateSchema.parse({ slot, ...input }), 200)
  })
