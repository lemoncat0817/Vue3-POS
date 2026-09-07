import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, like } from 'drizzle-orm'
import { createOrderRequestSchema, orderSchema, type AppliedCoupon } from '@pos/contract'
import { priceLine, type OftenUseRates } from '@pos/domain'
import { moneyCoupons, orderLines, orders, oftenUseRates as oftenUseRatesTable, percentCoupons } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

/**
 * 送單只包含「選了什麼」，金額一律由這裡用 @pos/domain 的 priceLine()
 * 重新計算——用戶端送來的數字不被信任，這是 D-01／D-02 修復方式在
 * 伺服端的延伸（見重構規劃書 §6、packages/pos-contract/src/order.ts
 * 的說明）。
 *
 * P4 之前這個端點沒有掛任何裝置憑證檢查——任何打得到這個 API 的人都能
 * 建立訂單，是身分系統落地前的一個真實缺口。掛上 requireDeviceToken
 * 之後，apps/pos 送單時要記得帶 X-Device-Token（見 src/api/http.ts）。
 */
const createOrderRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
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
    400: {
      description: '套用的折價券不存在',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
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

/**
 * 常用折扣（P5：促銷引擎）改由 often_use_rates 表提供，取代 P2～P4
 * 沿用的 config/often-use-rates.ts 固定值——後台現在可以編輯這 5 筆
 * 資料，這裡永遠讀當下的值，不會有「後台改了、送單卻還用舊值」的
 * 不一致。缺任何一個 slot 都直接讓這次送單失敗（500），而不是悄悄用
 * 假資料補上：常用折扣的 5 筆資料本來就該由 seed/promotions.sql 保證
 * 存在，缺資料代表部署流程本身有問題，比起算出錯的折扣，讓它在這裡
 * 就爆出來更安全。
 */
async function loadOftenUseRates(db: AnyDb): Promise<OftenUseRates> {
  const rows = await db.select().from(oftenUseRatesTable).all()
  const bySlot = new Map(rows.map((row) => [row.slot, row]))
  const at = (slot: number) => {
    const row = bySlot.get(slot)
    if (!row) {
      throw new Error(`常用折扣缺少 slot ${slot} 的資料，請先套用 seed/promotions.sql`)
    }
    return { name: row.name, discountMoney: row.discountMoney, discountPercent: row.discountPercent }
  }
  return [at(0), at(1), at(2), at(3), at(4)]
}

/**
 * 訂單層級折價券（P5）：用戶端只送「套用了哪張」，實際折抵金額查真正
 * 的折價券資料重算——不相信用戶端算好的數字，這是 D-01／D-02 修復
 * 方式的延伸。折抵後金額不會是負的（money 折價券面額超過訂單金額時，
 * 實際折抵只到 0 元為止，不是讓應付金額變負數），公式跟 apps/pos 舊版
 * drinkStore.drinkPayPrice 的既有邏輯一致。
 */
async function resolveOrderPayment(
  db: AnyDb,
  appliedCoupon: AppliedCoupon,
  orderTotalPrice: number,
): Promise<{ orderPaymentPrice: number; discountName: string } | { error: string }> {
  if (appliedCoupon.type === 'none') {
    return { orderPaymentPrice: orderTotalPrice, discountName: '無' }
  }
  if (appliedCoupon.type === 'money') {
    const coupon = await db.select().from(moneyCoupons).where(eq(moneyCoupons.id, appliedCoupon.couponId)).get()
    if (!coupon) return { error: '找不到這張現金折價券' }
    return { orderPaymentPrice: Math.max(0, orderTotalPrice - coupon.discountMoney), discountName: coupon.name }
  }
  const coupon = await db.select().from(percentCoupons).where(eq(percentCoupons.id, appliedCoupon.couponId)).get()
  if (!coupon) return { error: '找不到這張折數折價券' }
  return {
    orderPaymentPrice: Math.max(0, Math.round(orderTotalPrice * coupon.discountPercent)),
    discountName: coupon.name,
  }
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

    const oftenUseRatesNow = await loadOftenUseRates(db)
    const pricedLines = input.lines.map((line) => {
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        line,
        oftenUseRatesNow,
      )
      return { ...line, ...priced }
    })

    const orderTotalPrice = pricedLines.reduce((sum, line) => sum + line.totalPrice, 0) + input.bagCount
    const payment = await resolveOrderPayment(db, input.appliedCoupon, orderTotalPrice)
    if ('error' in payment) {
      return c.json({ error: payment.error }, 400)
    }
    const { orderPaymentPrice, discountName } = payment
    const orderDiscount = orderTotalPrice - orderPaymentPrice
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
      orderDiscount,
      orderPaymentPrice,
      discountName,
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
