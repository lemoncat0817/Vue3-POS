import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createInvoiceTrackRequestSchema,
  invoiceTrackSchema,
  submitInvoicesResponseSchema,
} from '@pos/contract'
import { invoiceTracks, orders } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

/**
 * 電子發票字軌與模擬上傳 API（P23：規劃書 §10 P23「電子發票平台
 * 串接」，見 db/schema.ts 的 invoiceTracks／orders.invoiceStatus 說明）。
 */
const errorSchema = z.object({ error: z.string() })

const listTracksRoute = createRoute({
  method: 'get',
  path: '/tracks',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: { description: '字軌列表', content: { 'application/json': { schema: invoiceTrackSchema.array() } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createTrackRoute = createRoute({
  method: 'post',
  path: '/tracks',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createInvoiceTrackRequestSchema } } } },
  responses: {
    201: { description: '字軌建立成功，並自動設為啟用中', content: { 'application/json': { schema: invoiceTrackSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const submitInvoicesRoute = createRoute({
  method: 'post',
  path: '/submit',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '模擬批次上傳：把目前所有「已開立、尚未上傳」的發票標成已上傳',
      content: { 'application/json': { schema: submitInvoicesResponseSchema } },
    },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const invoiceRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listTracksRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(invoiceTracks).all()
    return c.json(rows, 200)
  })
  .openapi(createTrackRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    // 同時間只會有一個字軌是啟用中的（見 nextInvoiceNumber 的說明）
    // ——新增一個字軌代表「換下一期」，把之前所有字軌都停用。這裡不是
    // db.transaction()（理由跟 routes/orders.ts 送單那段一致：D1／
    // better-sqlite3 的交易介面不一致，見該檔案的說明），兩個 update
    // 之間如果剛好有另一筆請求核發發票號碼，最壞情況是那筆訂單用了
    // 舊字軌——單店單機情境下這個時間窗口小到可以接受，不是常態併發
    // 場景。
    await db.update(invoiceTracks).set({ isActive: false })
    const newTrack = { id: crypto.randomUUID(), ...input, currentNumber: input.rangeStart - 1, isActive: true }
    await db.insert(invoiceTracks).values(newTrack)
    return c.json(newTrack, 201)
  })
  .openapi(submitInvoicesRoute, async (c) => {
    const db = c.get('db')
    // 這裡是模擬——真正上傳到財政部電子發票整合服務平台需要真正的
    // 介接憑證（這個專案沒有，見規劃書「沒有介接硬體需求」同樣精神的
    // 說明）。之後拿到真正的憑證，只需要把下面這段換成真的呼叫平台
    // API，資料模型（哪些發票是 'issued'、上傳後標成 'submitted'）
    // 已經是照真實流程設計，不需要另外改資料庫結構。
    const submittedAt = new Date().toISOString()
    const pending = await db.select().from(orders).where(eq(orders.invoiceStatus, 'issued')).all()
    for (const order of pending) {
      await db.update(orders).set({ invoiceStatus: 'submitted', invoiceSubmittedAt: submittedAt }).where(eq(orders.orderId, order.orderId))
    }
    return c.json({ submittedCount: pending.length, submittedAt }, 200)
  })
