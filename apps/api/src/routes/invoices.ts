import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq } from 'drizzle-orm'
import {
  createInvoiceTrackRequestSchema,
  invoiceTrackSchema,
  submitInvoicesResponseSchema
} from '@pos/contract'
import { invoiceTracks, orders } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

const listTracksRoute = createRoute({
  method: 'get',
  path: '/tracks',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '字軌列表',
      content: { 'application/json': { schema: invoiceTrackSchema.array() } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const createTrackRoute = createRoute({
  method: 'post',
  path: '/tracks',
  middleware: [requireDeviceToken, requireCapability('canCheckBackgroundSetting')] as const,
  request: {
    body: { content: { 'application/json': { schema: createInvoiceTrackRequestSchema } } }
  },
  responses: {
    201: {
      description: '字軌建立成功，並自動設為啟用中',
      content: { 'application/json': { schema: invoiceTrackSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const submitInvoicesRoute = createRoute({
  method: 'post',
  path: '/submit',
  middleware: [requireDeviceToken, requireCapability('canCheckBackgroundSetting')] as const,
  responses: {
    200: {
      description: '模擬批次上傳：把目前所有「已開立、尚未上傳」的發票標成已上傳',
      content: { 'application/json': { schema: submitInvoicesResponseSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const invoiceRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listTracksRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select()
      .from(invoiceTracks)
      .where(tenantFilter(invoiceTracks.tenantId, tenantId))
      .all()
    return c.json(rows, 200)
  })
  .openapi(createTrackRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    // 建立新字軌時停用既有字軌，確保同一租戶僅單一字軌啟用
    await db
      .update(invoiceTracks)
      .set({ isActive: false })
      .where(tenantFilter(invoiceTracks.tenantId, tenantId))
    const newTrack = {
      id: crypto.randomUUID(),
      tenantId,
      ...input,
      currentNumber: input.rangeStart - 1,
      isActive: true
    }
    await db.insert(invoiceTracks).values(newTrack)
    return c.json(newTrack, 201)
  })
  .openapi(submitInvoicesRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const submittedAt = new Date().toISOString()
    const pending = await db
      .select()
      .from(orders)
      .where(and(eq(orders.invoiceStatus, 'issued'), tenantFilter(orders.tenantId, tenantId)))
      .all()
    for (const order of pending) {
      await db
        .update(orders)
        .set({ invoiceStatus: 'submitted', invoiceSubmittedAt: submittedAt })
        .where(eq(orders.orderId, order.orderId))
    }
    return c.json({ submittedCount: pending.length, submittedAt }, 200)
  })
