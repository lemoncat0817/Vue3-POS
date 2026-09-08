import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import {
  createMemberRequestSchema,
  memberDetailSchema,
  memberSchema,
  updateMemberRequestSchema,
} from '@pos/contract'
import { members, orders } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

/**
 * 會員管理 API（P22：規劃書 §10 P22「會員與顧客經營」）。跟菜單、
 * 員工、付款方式的寫入端點是同一套模式（P18）：新資源 id 一律由
 * 伺服端配發，見 db/schema.ts 的 members 說明。
 */
const errorSchema = z.object({ error: z.string() })

const listMembersRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: {
    // 結帳當下用手機號碼查會員（見 apps/pos/src/views/home/index.vue
    // 的說明），前端不需要拉全部會員清單再自己過濾。
    query: z.object({ phone: z.string().min(1).optional() }),
  },
  responses: {
    200: { description: '會員列表', content: { 'application/json': { schema: memberSchema.array() } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createMemberRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { body: { content: { 'application/json': { schema: createMemberRequestSchema } } } },
  responses: {
    201: { description: '會員建立成功', content: { 'application/json': { schema: memberSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這個手機號碼已經是會員', content: { 'application/json': { schema: errorSchema } } },
  },
})

const getMemberRoute = createRoute({
  method: 'get',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: { description: '會員詳細資料＋消費紀錄', content: { 'application/json': { schema: memberDetailSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateMemberRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateMemberRequestSchema } } },
  },
  responses: {
    200: { description: '會員更新成功', content: { 'application/json': { schema: memberSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這個手機號碼已經是別的會員', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteMemberRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireDeviceToken] as const,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    204: { description: '會員已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這個會員', content: { 'application/json': { schema: errorSchema } } },
  },
})

export const memberRoutes = new OpenAPIHono<AppEnv>()
  .openapi(listMembersRoute, async (c) => {
    const { phone } = c.req.valid('query')
    const db = c.get('db')
    const rows = phone
      ? await db.select().from(members).where(eq(members.phone, phone)).all()
      : await db.select().from(members).all()
    return c.json(rows, 200)
  })
  .openapi(createMemberRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(members).where(eq(members.phone, input.phone)).get()
    if (existing) return c.json({ error: '這個手機號碼已經是會員' }, 409)
    const newMember = { id: crypto.randomUUID(), ...input, points: 0, createdAt: new Date().toISOString() }
    await db.insert(members).values(newMember)
    return c.json(newMember, 201)
  })
  .openapi(getMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const member = await db.select().from(members).where(eq(members.id, id)).get()
    if (!member) return c.json({ error: '找不到這個會員' }, 404)
    const memberOrders = await db
      .select({
        orderId: orders.orderId,
        orderTime: orders.orderTime,
        orderStatus: orders.orderStatus,
        orderPaymentPrice: orders.orderPaymentPrice,
      })
      .from(orders)
      .where(eq(orders.memberId, id))
      .orderBy(desc(orders.orderTime))
      .all()
    return c.json({ ...member, orders: memberOrders }, 200)
  })
  .openapi(updateMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const existing = await db.select().from(members).where(eq(members.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    const phoneTaken = await db.select().from(members).where(eq(members.phone, input.phone)).get()
    if (phoneTaken && phoneTaken.id !== id) return c.json({ error: '這個手機號碼已經是別的會員' }, 409)
    await db.update(members).set(input).where(eq(members.id, id))
    return c.json({ ...existing, ...input }, 200)
  })
  .openapi(deleteMemberRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const existing = await db.select().from(members).where(eq(members.id, id)).get()
    if (!existing) return c.json({ error: '找不到這個會員' }, 404)
    // 訂單本身是交易憑證，不因為會員被刪除就跟著消失——orders.member_id
    // 有外鍵約束（見 db/schema.ts），刪除前先把這個會員名下的訂單解除
    // 關聯（存 null），保留消費紀錄本身，只是不再掛在任何會員名下。
    // 這跟 routes/catalog.ts 刪除飲品類型前檢查底下有沒有品項（回 409
    // 擋掉）是不同的取捨：菜單類型底下有品項通常代表操作者忘記先清空，
    // 值得先擋下來確認；會員的消費紀錄只會越存越多，要求「刪會員前先
    // 清空歷史訂單」不合理，直接解除關聯才是符合實際使用情境的行為。
    await db.update(orders).set({ memberId: null }).where(eq(orders.memberId, id))
    await db.delete(members).where(eq(members.id, id))
    return c.body(null, 204)
  })
