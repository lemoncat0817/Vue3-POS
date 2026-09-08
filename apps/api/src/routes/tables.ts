import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createTableRequestSchema,
  diningTableSchema,
  updateTableRequestSchema,
  updateTableStatusRequestSchema,
} from '@pos/contract'
import { diningTables } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

/**
 * 桌況管理 API（P24：規劃書 §10 P24「真實硬體整合與桌況管理」，見
 * db/schema.ts 的 diningTables 說明）。跟菜單、員工的寫入端點是同一套
 * 模式（P18）：新資源 id 一律由伺服端配發。
 */
const errorSchema = z.object({ error: z.string() })

const listTablesRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: { description: '桌況列表', content: { 'application/json': { schema: diningTableSchema.array() } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createTableRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createTableRequestSchema } } } },
  responses: {
    201: { description: '桌位建立成功，預設為空桌', content: { 'application/json': { schema: diningTableSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateTableRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateTableRequestSchema } } },
  },
  responses: {
    200: { description: '桌位資料更新成功', content: { 'application/json': { schema: diningTableSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個桌位', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateTableStatusRoute = createRoute({
  method: 'patch',
  path: '/{id}/status',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateTableStatusRequestSchema } } },
  },
  responses: {
    200: { description: '桌況更新成功', content: { 'application/json': { schema: diningTableSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個桌位', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteTableRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '桌位已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個桌位', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const tableRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listTablesRoute, async (c) => {
    const db = c.get('db')
    const rows = await db.select().from(diningTables).all()
    return c.json(rows, 200)
  })
  .openapi(createTableRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const newTable = { id: crypto.randomUUID(), ...input, status: 'empty' as const, note: '' }
    await db.insert(diningTables).values(newTable)
    return c.json(newTable, 201)
  })
  .openapi(updateTableRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(diningTables).where(eq(diningTables.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個桌位' }, 404)
    await db.update(diningTables).set(input).where(eq(diningTables.id, id))
    return c.json({ ...existing, ...input }, 200)
  })
  .openapi(updateTableStatusRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(diningTables).where(eq(diningTables.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個桌位' }, 404)
    // note 選填：沒帶就維持原本的備註，不會被清空——跟只想切換狀態
    // （例如帶位時標成使用中）的常見操作情境一致，不用每次都重打一次
    // 備註。
    const updated = { status: input.status, note: input.note ?? existing.note }
    await db.update(diningTables).set(updated).where(eq(diningTables.id, id))
    return c.json({ ...existing, ...updated }, 200)
  })
  .openapi(deleteTableRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(diningTables).where(eq(diningTables.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個桌位' }, 404)
    await db.delete(diningTables).where(eq(diningTables.id, id))
    return c.body(null, 204)
  })
