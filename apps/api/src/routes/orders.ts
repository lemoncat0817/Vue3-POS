import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, like } from 'drizzle-orm'
import { createOrderRequestSchema, orderSchema } from '@pos/contract'
import { priceLine } from '@pos/domain'
import { orderLines, orders } from '../db/schema'
import { CURRENT_OFTEN_USE_RATES } from '../config/often-use-rates'
import type { AppEnv } from '../types'

/**
 * 送單只包含「選了什麼」，金額一律由這裡用 @pos/domain 的 priceLine()
 * 重新計算——用戶端送來的數字不被信任，這是 D-01／D-02 修復方式在
 * 伺服端的延伸（見重構規劃書 §6、packages/pos-contract/src/order.ts
 * 的說明）。
 */
const createOrderRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: { 'application/json': { schema: createOrderRequestSchema } },
    },
  },
  responses: {
    200: {
      description: '訂單已存在（同一個 idempotencyKey 重送，回傳原本那筆，不會建立第二筆）',
      content: { 'application/json': { schema: orderSchema } },
    },
    201: {
      description: '訂單建立成功',
      content: { 'application/json': { schema: orderSchema } },
    },
  },
})

const listOrdersRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: '訂單清單',
      content: { 'application/json': { schema: z.array(orderSchema) } },
    },
  },
})

type OrderRow = typeof orders.$inferSelect
type OrderLineRow = typeof orderLines.$inferSelect

function toOrderResponse(order: OrderRow, lines: OrderLineRow[]) {
  return orderSchema.parse({
    orderId: order.orderId,
    orderTime: order.orderTime,
    orderStatus: order.orderStatus,
    staff: order.staff,
    orderBagCount: order.orderBagCount,
    orderCupCount: order.orderCupCount,
    orderTotalPrice: order.orderTotalPrice,
    orderPayment: order.orderPayment,
    orderDiscount: order.orderDiscount,
    orderPaymentPrice: order.orderPaymentPrice,
    discountName: order.discountName,
    orderData: lines.map((line) => ({
      name: line.name,
      price: line.price,
      size: line.size,
      count: line.count,
      addList: line.addList,
      addListPrice: line.addListPrice,
      freeDiscount: line.freeDiscount,
      ecoDiscount: line.ecoDiscount,
      bottleDiscount: line.bottleDiscount,
      oftenUseDiscount1: line.oftenUseDiscount1,
      oftenUseDiscount2: line.oftenUseDiscount2,
      oftenUseDiscount3: line.oftenUseDiscount3,
      discount: line.discount,
      totalPrice: line.totalPrice,
      currentDiscountMoney: line.currentDiscountMoney,
      currentDiscountPercent: line.currentDiscountPercent,
      useDiscountMoney: line.useDiscountMoney,
      useDiscountPercent: line.useDiscountPercent,
      useDiscountFree: line.useDiscountFree,
    })),
  })
}

export const orderRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createOrderRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).get()
    if (existing) {
      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, existing.orderId)).all()
      return c.json(toOrderResponse(existing, lines), 200)
    }

    // 序號：同一個營業日內的訂單數 + 1（單店單機情境，見重構規劃書
    // §3「門市規模」的前提）。多終端情境下的序號分配是 P6 的範圍。
    const sameDayOrders = await db
      .select()
      .from(orders)
      .where(like(orders.orderId, `${input.businessDate}%`))
      .all()
    const orderId = `${input.businessDate}${sameDayOrders.length + 1}`

    const pricedLines = input.lines.map((line) => {
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        line,
        CURRENT_OFTEN_USE_RATES,
      )
      return { ...line, ...priced }
    })

    const orderTotalPrice = pricedLines.reduce((sum, line) => sum + line.totalPrice, 0) + input.bagCount
    const orderPaymentPrice = Math.max(0, orderTotalPrice - input.orderDiscount)
    const orderCupCount = pricedLines.reduce((sum, line) => sum + line.count, 0)
    const orderTime = new Date().toISOString()

    const newOrder: OrderRow = {
      orderId,
      orderTime,
      orderStatus: '已完成',
      staff: input.staff,
      orderBagCount: input.bagCount,
      orderCupCount,
      orderTotalPrice,
      orderPayment: input.payment,
      orderDiscount: input.orderDiscount,
      orderPaymentPrice,
      discountName: input.discountName,
      idempotencyKey: input.idempotencyKey,
      createdAt: orderTime,
    }

    // 這裡刻意不用 db.transaction()：better-sqlite3 的交易回呼要求同步
    // 函式，D1 的 batch() 則要求非同步、且兩者簽章不同，無法用同一段
    // 程式碼透過 AnyDb 泛型介面統一呼叫。這兩個 insert 因此不是原子的
    // ——之後若要在 D1 上補回真正的原子性，走 D1 專屬的 db.batch()，
    // 屬於 route 邏輯要對 driver 分流處理的範圍，目前先接受這個落差。
    await db.insert(orders).values(newOrder)
    await db.insert(orderLines).values(pricedLines.map((line) => ({ ...line, orderId })))

    const insertedLines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    return c.json(toOrderResponse(newOrder, insertedLines), 201)
  })
  .openapi(listOrdersRoute, async (c) => {
    const db = c.get('db')
    const allOrders = await db.select().from(orders).all()
    const allLines = await db.select().from(orderLines).all()

    const linesByOrder = new Map<string, OrderLineRow[]>()
    for (const line of allLines) {
      const list = linesByOrder.get(line.orderId) ?? []
      list.push(line)
      linesByOrder.set(line.orderId, list)
    }

    return c.json(
      allOrders.map((order) => toOrderResponse(order, linesByOrder.get(order.orderId) ?? [])),
      200,
    )
  })
