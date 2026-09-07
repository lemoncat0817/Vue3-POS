import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq, gte, lt } from 'drizzle-orm'
import {
  addCashMovementRequestSchema,
  closeShiftRequestSchema,
  openShiftRequestSchema,
  shiftSchema,
} from '@pos/contract'
import { summarizeShiftCash } from '@pos/domain'
import { cashMovements, orderTenders, orders, shifts } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

/**
 * 班別結帳（P6：規劃書 §10 P0「班別結帳」）。單店單機情境（見規劃書
 * §3），同一時間全店只允許一筆 open 狀態的班別——開帳前先查有沒有
 * 別的班別還開著，有的話直接擋（409），不是資料庫層級的唯一索引（見
 * db/schema.ts 的說明）。
 */
const errorSchema = z.object({ error: z.string() })

const openShiftRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: {
    body: { content: { 'application/json': { schema: openShiftRequestSchema } } },
  },
  responses: {
    200: { description: '這個 shiftId 已經開過帳，回傳原本那筆（冪等）', content: { 'application/json': { schema: shiftSchema } } },
    201: { description: '開帳成功', content: { 'application/json': { schema: shiftSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '已經有一筆班別是開帳狀態，須先收班', content: { 'application/json': { schema: errorSchema } } },
  },
})

const getCurrentShiftRoute = createRoute({
  method: 'get',
  path: '/current',
  responses: {
    200: { description: '目前開帳中的班別', content: { 'application/json': { schema: shiftSchema } } },
    404: { description: '目前沒有開帳中的班別', content: { 'application/json': { schema: errorSchema } } },
  },
})

const addCashMovementRoute = createRoute({
  method: 'post',
  path: '/{id}/cash-movements',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: addCashMovementRequestSchema } } },
  },
  responses: {
    201: { description: '現金異動已記錄', content: { 'application/json': { schema: shiftSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆班別', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這筆班別已經收班，不能再記錄現金異動', content: { 'application/json': { schema: errorSchema } } },
  },
})

const closeShiftRoute = createRoute({
  method: 'post',
  path: '/{id}/close',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: closeShiftRequestSchema } } },
  },
  responses: {
    200: { description: '收班成功，回傳含帳差的班別報表', content: { 'application/json': { schema: shiftSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆班別', content: { 'application/json': { schema: errorSchema } } },
    409: { description: '這筆班別已經收班', content: { 'application/json': { schema: errorSchema } } },
  },
})

type ShiftRow = typeof shifts.$inferSelect
type CashMovementRow = typeof cashMovements.$inferSelect

function toShiftResponse(row: ShiftRow, movements: CashMovementRow[]) {
  const cashIn = movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.amount, 0)
  const cashOut = movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.amount, 0)
  return shiftSchema.parse({
    id: row.id,
    status: row.status,
    openedBy: row.openedBy,
    openedAt: row.openedAt,
    openingFloat: row.openingFloat,
    closedBy: row.closedBy,
    closedAt: row.closedAt,
    cashSales: row.cashSales,
    cashIn,
    cashOut,
    expectedCash: row.expectedCash,
    actualCash: row.actualCash,
    variance: row.variance,
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      amount: m.amount,
      reason: m.reason,
      operator: m.operator,
      at: m.at,
    })),
  })
}

async function loadShiftWithMovements(db: AnyDb, shiftId: string) {
  const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId)).get()
  if (!shift) return undefined
  const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, shiftId)).all()
  return { shift, movements }
}

// 「現金類」付款方式只認字面值「現金」——apps/pos 的付款方式清單
// （見 stores/order.ts 的 paymentList）目前是純本機設定，沒有同步到
// 伺服端，伺服端無法得知哪些自訂方式應該算作現金。單店情境下「現金」
// 這個名稱本身就是固定種子資料，直接比對字面值是務實的做法；未來若
// 付款方式清單也搬到伺服端管理，這裡應該改成查那張表的「是否為現金
// 類」旗標。
const CASH_METHOD_NAME = '現金'

/** 統計 [openedAt, closedAt) 區間內，現金類 tender 的金額總和。 */
async function sumCashSales(db: AnyDb, openedAt: string, closedAt: string): Promise<number> {
  const rows = await db
    .select({ amount: orderTenders.amount })
    .from(orderTenders)
    .innerJoin(orders, eq(orders.orderId, orderTenders.orderId))
    .where(
      and(
        eq(orderTenders.method, CASH_METHOD_NAME),
        gte(orders.createdAt, openedAt),
        lt(orders.createdAt, closedAt),
      ),
    )
    .all()
  return rows.reduce((sum, row) => sum + row.amount, 0)
}

export const shiftRoutes = new OpenAPIHono<AppEnv>()
  .openapi(openShiftRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await loadShiftWithMovements(db, input.shiftId)
    if (existing) {
      return c.json(toShiftResponse(existing.shift, existing.movements), 200)
    }

    const stillOpen = await db.select().from(shifts).where(eq(shifts.status, 'open')).get()
    if (stillOpen) {
      return c.json({ error: `班別 ${stillOpen.id} 尚未收班，請先完成收班再開新的班別` }, 409)
    }

    const newShift: ShiftRow = {
      id: input.shiftId,
      status: 'open',
      openedBy: input.operator,
      openedAt: new Date().toISOString(),
      openingFloat: input.openingFloat,
      closedBy: null,
      closedAt: null,
      cashSales: null,
      expectedCash: null,
      actualCash: null,
      variance: null,
    }
    await db.insert(shifts).values(newShift)
    return c.json(toShiftResponse(newShift, []), 201)
  })
  .openapi(getCurrentShiftRoute, async (c) => {
    const db = c.get('db')
    const shift = await db.select().from(shifts).where(eq(shifts.status, 'open')).get()
    if (!shift) {
      return c.json({ error: '目前沒有開帳中的班別' }, 404)
    }
    const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, shift.id)).all()
    return c.json(toShiftResponse(shift, movements), 200)
  })
  .openapi(addCashMovementRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await loadShiftWithMovements(db, id)
    if (!existing) {
      return c.json({ error: '找不到這筆班別' }, 404)
    }
    if (existing.shift.status !== 'open') {
      return c.json({ error: '這筆班別已經收班，不能再記錄現金異動' }, 409)
    }

    await db.insert(cashMovements).values({
      shiftId: id,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      operator: input.operator,
      at: new Date().toISOString(),
    })

    const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, id)).all()
    return c.json(toShiftResponse(existing.shift, movements), 201)
  })
  .openapi(closeShiftRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await loadShiftWithMovements(db, id)
    if (!existing) {
      return c.json({ error: '找不到這筆班別' }, 404)
    }
    if (existing.shift.status !== 'open') {
      return c.json({ error: '這筆班別已經收班' }, 409)
    }

    const closedAt = new Date().toISOString()
    const cashSales = await sumCashSales(db, existing.shift.openedAt, closedAt)
    const cashIn = existing.movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.amount, 0)
    const cashOut = existing.movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.amount, 0)
    const { expectedCash, variance } = summarizeShiftCash({
      openingFloat: existing.shift.openingFloat,
      cashSales,
      cashIn,
      cashOut,
      actualCash: input.actualCash,
    })

    const closedShift: ShiftRow = {
      ...existing.shift,
      status: 'closed',
      closedBy: input.operator,
      closedAt,
      cashSales,
      expectedCash,
      actualCash: input.actualCash,
      variance,
    }
    await db
      .update(shifts)
      .set({ status: 'closed', closedBy: input.operator, closedAt, cashSales, expectedCash, actualCash: input.actualCash, variance })
      .where(eq(shifts.id, id))

    return c.json(toShiftResponse(closedShift, existing.movements), 200)
  })
