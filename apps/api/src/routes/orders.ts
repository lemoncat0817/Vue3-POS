import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, sql } from 'drizzle-orm'
import { createOrderRequestSchema, orderSchema, orderStatusSchema, type AppliedCoupon } from '@pos/contract'
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

const errorSchema = z.object({ error: z.string() })

/**
 * P6：apps/pos 的訂單列表頁（編輯訂單狀態／刪除訂單）原本只改本機
 * Pinia 狀態，從來沒有打過任何 API——單店單機情境下看不太出問題，但
 * 一旦有第二台終端（或同一台裝置重新整理），本機的異動就會被伺服端
 * 尚未更新的資料蓋掉，兩邊看到的訂單狀態不一致。這兩個端點把這個動作
 * 變成真的伺服端操作。
 */
const updateOrderStatusRequestSchema = z.object({ orderStatus: orderStatusSchema })

const updateOrderStatusRoute = createRoute({
  method: 'patch',
  path: '/{orderId}/status',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateOrderStatusRequestSchema } } },
  },
  responses: {
    200: { description: '訂單狀態更新成功', content: { 'application/json': { schema: orderSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } },
  },
})

// 這裡是真的從資料庫刪掉整筆訂單（含明細），不是軟刪除／狀態標記——
// 沿用 apps/pos 既有「刪除訂單」的語意（見 views/order/index.vue）。
// 對正式營運的收銀紀錄而言，事後想留稽核軌跡的話，更常見的做法是只
// 允許把狀態改成「已取消」、不允許真的刪除；這裡沒有另外加這層限制，
// 是刻意保留跟既有 UI 一致的行為，不是這個端點本身故意要禁止軟刪除。
const deleteOrderRoute = createRoute({
  method: 'delete',
  path: '/{orderId}',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
  },
  responses: {
    204: { description: '訂單已刪除' },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } },
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
 * 原子核發下一個訂單序號（P6：規劃書 §3「多終端情境」）。單一 SQL
 * 陳述式（INSERT ... ON CONFLICT DO UPDATE ... RETURNING）內完成
 * 「這個營業日目前的計數、加一、寫回」，不需要另外包交易——單一陳述式
 * 本身就是原子的，兩台終端幾乎同時送單也不會核發到同一個序號（對照
 * P2～P5「查同一營業日已有幾筆訂單、+1」的作法：兩次查詢中間有空檔，
 * 兩台終端可能查到同一個計數，算出同一個序號，其中一筆 insert 會因為
 * orderId 撞到 primary key 直接失敗）。
 *
 * 第一次插入某個營業日的計數列時，起始值不是無條件從 1 開始，而是
 * COALESCE 這個營業日在 orders 表裡已經用掉的最大序號＋1（沒有的話
 * 才是 1）。這不是多餘的防禦：這張表是這次改動才新增的，orders 表裡
 * 可能已經有用舊版「查訂單數＋1」算出來的資料（本機開發／既有部署都
 * 是這樣）——如果無條件從 1 開始，第一筆新單就會撞到舊資料的
 * primary key。這裡假設 orderId 固定是 8 碼營業日＋序號（SUBSTR 從
 * 第 9 碼切）——businessDateSchema 已經驗證是 8 碼數字，這個假設成立。
 */
async function nextOrderSequence(db: AnyDb, businessDate: string): Promise<number> {
  // 刻意不把 orderSequences／orders 的 Column 物件內插進這段 sql``——
  // drizzle 會把它們展開成完整限定名稱（例如 "order_sequences"."business_date"），
  // 但 SQLite 的 INSERT 欄位清單、ON CONFLICT 欄位清單、SET 左側都只
  // 接受不限定的欄位名稱，用限定名稱會直接語法錯誤。這裡的表名／欄位名
  // 都是寫死的常值（不是使用者輸入），直接寫字面量就好，只有真正的值
  // （businessDate）才用參數帶入。
  const row = await db.get<{ counter: number }>(sql`
    insert into order_sequences (business_date, counter)
    values (
      ${businessDate},
      coalesce(
        (select max(cast(substr(order_id, 9) as integer))
         from orders where order_id like ${businessDate} || '%'),
        0
      ) + 1
    )
    on conflict (business_date) do update set counter = counter + 1
    returning counter
  `)
  if (!row) {
    throw new Error(`核發訂單序號失敗（businessDate=${businessDate}）`)
  }
  return row.counter
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

    // 序號核發之後，如果下面的 insert 因為其他原因失敗，這個序號就浪費
    // 掉了（不會被回收重用）——序號中間有空隙是可以接受的，序號撞號
    // （見 nextOrderSequence 的說明）不行。
    const sequence = await nextOrderSequence(db, input.businessDate)
    const orderId = `${input.businessDate}${sequence}`

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
  .openapi(updateOrderStatusRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const { orderStatus } = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.orderId, orderId)).get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    await db.update(orders).set({ orderStatus }).where(eq(orders.orderId, orderId))
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    return c.json(toOrderResponse({ ...existing, orderStatus }, lines), 200)
  })
  .openapi(deleteOrderRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.orderId, orderId)).get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    // 先刪明細再刪主檔（order_lines.order_id 參照 orders.order_id，見
    // db/schema.ts），順序反過來會違反外鍵約束。
    await db.delete(orderLines).where(eq(orderLines.orderId, orderId))
    await db.delete(orders).where(eq(orders.orderId, orderId))
    return c.body(null, 204)
  })
