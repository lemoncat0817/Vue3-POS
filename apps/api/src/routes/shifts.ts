import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, eq, gte, lt } from 'drizzle-orm'
import {
  addCashMovementRequestSchema,
  closeShiftRequestSchema,
  openShiftRequestSchema,
  shiftSchema
} from '@pos/contract'
import { summarizeShiftCash } from '@pos/domain'
import { cashMovements, orderRefunds, orderTenders, orders, shifts } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

/** 班別結帳 API。單店單機情境下同一時間僅允許一筆 open 狀態班別。 */
const errorSchema = z.object({ error: z.string() })

const openShiftRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken, requireCapability('canManageShift')] as const,
  request: {
    body: { content: { 'application/json': { schema: openShiftRequestSchema } } }
  },
  responses: {
    200: {
      description: '這個 shiftId 已經開過帳，回傳原本那筆（冪等）',
      content: { 'application/json': { schema: shiftSchema } }
    },
    201: { description: '開帳成功', content: { 'application/json': { schema: shiftSchema } } },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '已經有一筆班別是開帳狀態，須先收班',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const getCurrentShiftRoute = createRoute({
  method: 'get',
  path: '/current',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '目前開帳中的班別',
      content: { 'application/json': { schema: shiftSchema } }
    },
    404: {
      description: '目前沒有開帳中的班別',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const addCashMovementRoute = createRoute({
  method: 'post',
  path: '/{id}/cash-movements',
  middleware: [requireDeviceToken, requireCapability('canManageShift')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: addCashMovementRequestSchema } } }
  },
  responses: {
    201: {
      description: '現金異動已記錄',
      content: { 'application/json': { schema: shiftSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這筆班別',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '這筆班別已經收班，不能再記錄現金異動',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const closeShiftRoute = createRoute({
  method: 'post',
  path: '/{id}/close',
  middleware: [requireDeviceToken, requireCapability('canManageShift')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: closeShiftRequestSchema } } }
  },
  responses: {
    200: {
      description: '收班成功，回傳含帳差的班別報表',
      content: { 'application/json': { schema: shiftSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這筆班別',
      content: { 'application/json': { schema: errorSchema } }
    },
    409: {
      description: '這筆班別已經收班',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
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
    refunds: row.refunds,
    expectedCash: row.expectedCash,
    actualCash: row.actualCash,
    variance: row.variance,
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      amount: m.amount,
      reason: m.reason,
      operator: m.operator,
      at: m.at
    }))
  })
}

async function loadShiftWithMovements(db: AnyDb, tenantId: string | null, shiftId: string) {
  const shift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.id, shiftId), tenantFilter(shifts.tenantId, tenantId)))
    .get()
  if (!shift) return undefined
  const movements = await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.shiftId, shiftId))
    .all()
  return { shift, movements }
}

// 現金類付款方式目前比對字面值「現金」，未來可擴充為查詢屬性旗標。
const CASH_METHOD_NAME = '現金'

/** 統計區間內現金 tender 總額。排除已取消訂單，避免虛增應有現金。 */
async function sumCashSales(
  db: AnyDb,
  tenantId: string | null,
  openedAt: string,
  closedAt: string
): Promise<number> {
  const rows = await db
    .select({ amount: orderTenders.amount })
    .from(orderTenders)
    .innerJoin(orders, eq(orders.orderId, orderTenders.orderId))
    .where(
      and(
        eq(orderTenders.method, CASH_METHOD_NAME),
        eq(orders.orderStatus, '已完成'),
        gte(orders.createdAt, openedAt),
        lt(orders.createdAt, closedAt),
        tenantFilter(orders.tenantId, tenantId)
      )
    )
    .all()
  return rows.reduce((sum, row) => sum + row.amount, 0)
}

/** 統計區間內退款總額。依退款紀錄發生時間（at）歸屬班別，退款均視為現金抽屜支出。 */
async function sumCashRefunds(
  db: AnyDb,
  tenantId: string | null,
  openedAt: string,
  closedAt: string
): Promise<number> {
  const rows = await db
    .select({ amount: orderRefunds.amount })
    .from(orderRefunds)
    .where(
      and(
        gte(orderRefunds.at, openedAt),
        lt(orderRefunds.at, closedAt),
        tenantFilter(orderRefunds.tenantId, tenantId)
      )
    )
    .all()
  return rows.reduce((sum, row) => sum + row.amount, 0)
}

export const shiftRoutes = new OpenAPIHono<AppEnv>()
  .openapi(openShiftRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await loadShiftWithMovements(db, tenantId, input.shiftId)
    if (existing) {
      return c.json(toShiftResponse(existing.shift, existing.movements), 200)
    }

    const stillOpen = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.status, 'open'), tenantFilter(shifts.tenantId, tenantId)))
      .get()
    if (stillOpen) {
      return c.json({ error: `班別 ${stillOpen.id} 尚未收班，請先完成收班再開新的班別` }, 409)
    }

    const newShift: ShiftRow = {
      id: input.shiftId,
      tenantId,
      status: 'open',
      openedBy: input.operator,
      openedAt: new Date().toISOString(),
      openingFloat: input.openingFloat,
      closedBy: null,
      closedAt: null,
      cashSales: null,
      refunds: null,
      expectedCash: null,
      actualCash: null,
      variance: null
    }
    await db.insert(shifts).values(newShift)
    return c.json(toShiftResponse(newShift, []), 201)
  })
  .openapi(getCurrentShiftRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const shift = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.status, 'open'), tenantFilter(shifts.tenantId, tenantId)))
      .get()
    if (!shift) {
      return c.json({ error: '目前沒有開帳中的班別' }, 404)
    }
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shift.id))
      .all()
    return c.json(toShiftResponse(shift, movements), 200)
  })
  .openapi(addCashMovementRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await loadShiftWithMovements(db, tenantId, id)
    if (!existing) {
      return c.json({ error: '找不到這筆班別' }, 404)
    }
    if (existing.shift.status !== 'open') {
      return c.json({ error: '這筆班別已經收班，不能再記錄現金異動' }, 409)
    }

    await db.insert(cashMovements).values({
      tenantId,
      shiftId: id,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      operator: input.operator,
      at: new Date().toISOString()
    })

    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, id))
      .all()
    return c.json(toShiftResponse(existing.shift, movements), 201)
  })
  .openapi(closeShiftRoute, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await loadShiftWithMovements(db, tenantId, id)
    if (!existing) {
      return c.json({ error: '找不到這筆班別' }, 404)
    }
    if (existing.shift.status !== 'open') {
      return c.json({ error: '這筆班別已經收班' }, 409)
    }

    const closedAt = new Date().toISOString()
    const cashSales = await sumCashSales(db, tenantId, existing.shift.openedAt, closedAt)
    const refunds = await sumCashRefunds(db, tenantId, existing.shift.openedAt, closedAt)
    const cashIn = existing.movements
      .filter((m) => m.type === 'in')
      .reduce((sum, m) => sum + m.amount, 0)
    const cashOut = existing.movements
      .filter((m) => m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0)
    const { expectedCash, variance } = summarizeShiftCash({
      openingFloat: existing.shift.openingFloat,
      cashSales,
      cashIn,
      cashOut,
      cashRefunds: refunds,
      actualCash: input.actualCash
    })

    const closedShift: ShiftRow = {
      ...existing.shift,
      status: 'closed',
      closedBy: input.operator,
      closedAt,
      cashSales,
      refunds,
      expectedCash,
      actualCash: input.actualCash,
      variance
    }
    await db
      .update(shifts)
      .set({
        status: 'closed',
        closedBy: input.operator,
        closedAt,
        cashSales,
        refunds,
        expectedCash,
        actualCash: input.actualCash,
        variance
      })
      .where(eq(shifts.id, id))

    return c.json(toShiftResponse(closedShift, existing.movements), 200)
  })
