import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, sql } from 'drizzle-orm'
import {
  createOrderRequestSchema,
  orderSchema,
  orderStatusSchema,
  refundInputSchema,
  type AppliedCoupon,
  type InvoiceCarrier,
  type InvoiceStatus,
  type OrderLineInput,
  type TenderInput,
} from '@pos/contract'
import { priceLine, summarizeOrderRefunds, type QuickDiscount } from '@pos/domain'
import {
  addOnOptions,
  members,
  orderCoupons,
  orderLines,
  orderRefunds,
  orders,
  orderTenders,
  products,
  quickDiscounts as quickDiscountsTable,
} from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

// 送單只包含「選了什麼」，金額一律用 @pos/domain 的 priceLine() 在伺服端
// 重新計算，不信任用戶端送來的數字。掛 requireDeviceToken 後，apps/pos
// 送單需帶 X-Device-Token（見 src/api/http.ts）。
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
      description: '套用的折價券不存在、tenders 金額總和跟應付金額不符，或沒有可用的發票字軌（P23）',
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

// 訂單列表頁的狀態變更／刪除操作，過去只改本機 Pinia 狀態、沒有打 API
// ——多終端情境下本機異動會被伺服端資料蓋掉。這兩個端點讓它變成真正的
// 伺服端操作。改成「已取消」是真正的作廢，必須附上 reason／operator
// （見 db/schema.ts 的 voidReason 等欄位），班別結算也會排除這筆訂單的
// 現金 tender（見 shifts.ts 的 sumCashSales）。改回「已完成」則清空
// 這三個欄位，不需要 reason。
const updateOrderStatusRequestSchema = z
  .object({
    orderStatus: orderStatusSchema,
    operator: z.string().min(1),
    reason: z.string().min(1).optional(),
  })
  .refine((data) => data.orderStatus !== '已取消' || data.reason !== undefined, {
    message: '作廢訂單必須填寫原因',
    path: ['reason'],
  })

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

// 只允許對「已完成」的訂單退款（已作廢的訂單整筆不算數，不需另外退錢，
// 見 refund.ts）。退款金額不能超過目前還能退的額度（應付金額－已退
// 金額，用 summarizeOrderRefunds() 驗證），避免分次退款繞過單次金額檢查。
const createRefundRoute = createRoute({
  method: 'post',
  path: '/{orderId}/refunds',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: refundInputSchema } } },
  },
  responses: {
    200: { description: '這個 refundId 已經退過款（冪等），回傳目前的訂單狀態', content: { 'application/json': { schema: orderSchema } } },
    201: { description: '退款成功', content: { 'application/json': { schema: orderSchema } } },
    400: { description: '這筆訂單已作廢，或退款金額超過目前還能退的額度', content: { 'application/json': { schema: errorSchema } } },
    401: { description: '裝置憑證無效或缺漏', content: { 'application/json': { schema: errorSchema } } },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } },
  },
})

// 真的從資料庫刪掉整筆訂單（含明細），不是軟刪除——沿用既有「刪除訂單」
// 的語意（見 views/order/index.vue）。
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
type OrderTenderRow = typeof orderTenders.$inferSelect
type OrderRefundRow = typeof orderRefunds.$inferSelect

function toOrderResponse(order: OrderRow, lines: OrderLineRow[], tenders: OrderTenderRow[], refunds: OrderRefundRow[]) {
  const sortedRefunds = [...refunds].sort((a, b) => a.at.localeCompare(b.at))
  const { refundedAmount } = summarizeOrderRefunds(order.orderPaymentPrice, sortedRefunds)
  return orderSchema.parse({
    orderId: order.orderId,
    orderTime: order.orderTime,
    orderStatus: order.orderStatus,
    orderChannel: order.orderChannel,
    staff: order.staff,
    orderBagCount: order.orderBagCount,
    orderCupCount: order.orderCupCount,
    orderTotalPrice: order.orderTotalPrice,
    orderPayment: order.orderPayment,
    orderDiscount: order.orderDiscount,
    orderPaymentPrice: order.orderPaymentPrice,
    discountName: order.discountName,
    changeDue: order.changeDue,
    refunds: sortedRefunds.map((refund) => ({
      id: refund.id,
      amount: refund.amount,
      reason: refund.reason,
      operator: refund.operator,
      at: refund.at,
    })),
    refundedAmount,
    voidReason: order.voidReason,
    voidedBy: order.voidedBy,
    voidedAt: order.voidedAt,
    invoiceNumber: order.invoiceNumber,
    invoiceCarrier: toInvoiceCarrier(order.invoiceCarrierType, order.invoiceCarrierValue),
    memberId: order.memberId,
    invoiceStatus: order.invoiceStatus,
    invoiceSubmittedAt: order.invoiceSubmittedAt,
    tableNumber: order.tableNumber,
    note: order.note,
    tenders: [...tenders]
      .sort((a, b) => a.seq - b.seq)
      .map((tender) => ({
        method: tender.method,
        amount: tender.amount,
        ...(tender.receivedAmount === null ? {} : { receivedAmount: tender.receivedAmount }),
      })),
    orderData: lines.map((line) => ({
      name: line.name,
      price: line.price,
      count: line.count,
      addList: line.addList,
      addListPrice: line.addListPrice,
      freeDiscount: line.freeDiscount,
      quickDiscountId: line.quickDiscountId,
      discount: line.discount,
      totalPrice: line.totalPrice,
      quickDiscountName: line.quickDiscountName,
    })),
  })
}

// 快速折扣由 quick_discounts 表提供，永遠讀當下的值，不會有「後台改了、
// 送單卻還用舊值」的不一致。清單筆數不固定，找不到某個 quickDiscountId
// 時 priceLine() 視為未套用（可能是後台送單當下剛好刪掉那一筆）。
async function loadQuickDiscounts(db: AnyDb): Promise<QuickDiscount[]> {
  const rows = await db.select().from(quickDiscountsTable).all()
  return rows.map((row) => ({ id: row.id, name: row.name, kind: row.kind, value: row.value }))
}

// 原子核發下一個訂單序號：單一 SQL 陳述式（INSERT ... ON CONFLICT DO
// UPDATE ... RETURNING）完成「讀計數、加一、寫回」，不需要另外包交易，
// 兩台終端同時送單也不會核發到同一個序號。第一次插入某營業日的計數列
// 時，起始值用 COALESCE 抓 orders 表裡該營業日已用掉的最大序號＋1
// （沒有才是 1）——避免撞到用舊版「查訂單數＋1」算出來的既有資料。
// 假設 orderId 固定是 8 碼營業日＋序號（businessDateSchema 已驗證 8 碼）。
async function nextOrderSequence(db: AnyDb, businessDate: string): Promise<number> {
  // 刻意不把 Column 物件內插進這段 sql``——drizzle 會展開成完整限定名稱，
  // 但 SQLite 的 INSERT／ON CONFLICT／SET 欄位清單只接受不限定名稱。
  // 表名／欄位名是寫死常值，直接寫字面量，只有 businessDate 用參數帶入。
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

// 原子核發下一個發票號碼，寫法同 nextOrderSequence()（UPDATE ...
// RETURNING，單一陳述式保證原子性）。找不到啟用中的字軌、或號碼區間
// 用完，直接丟錯讓送單失敗——字軌用完卻繼續開發票是違法的。
async function nextInvoiceNumber(db: AnyDb): Promise<string> {
  const row = await db.get<{ trackCode: string; currentNumber: number }>(sql`
    update invoice_tracks
    set current_number = current_number + 1
    where is_active = 1 and current_number < range_end
    returning track_code as trackCode, current_number as currentNumber
  `)
  if (!row) {
    throw new Error('沒有可用的發票字軌（沒有啟用中的字軌，或號碼已用完），請先在後台設定電子發票字軌')
  }
  return `${row.trackCode}${String(row.currentNumber).padStart(8, '0')}`
}

/** DB 的 invoiceCarrierType／invoiceCarrierValue 兩欄組回 @pos/contract 的 InvoiceCarrier 判別聯集。 */
function toInvoiceCarrier(type: InvoiceCarrier['type'], value: string | null): InvoiceCarrier {
  if (type === '無載具') return { type }
  return { type, value: value ?? '' }
}

// 送單成功後扣庫存。訂單品項只存名稱，這裡用名稱比對回菜單品項／配料
// ——改過名字的品項，舊訂單不會再扣到它的庫存，屬已知限制。庫存為 null
// 或找不到對應品項時直接略過，扣到 0 就不再往下扣，也不會因庫存不夠
// 擋下訂單：目前只做「扣減與示警」，真正的超賣防護留待之後需要再做。
async function deductStock(db: AnyDb, lines: Pick<OrderLineInput, 'name' | 'count' | 'addList'>[]): Promise<void> {
  for (const line of lines) {
    const item = await db.select().from(products).where(eq(products.name, line.name)).get()
    if (item && item.stock !== null) {
      await db.update(products).set({ stock: Math.max(0, item.stock - line.count) }).where(eq(products.id, item.id))
    }
    if (Array.isArray(line.addList)) {
      for (const addOnName of line.addList) {
        const addOn = await db.select().from(addOnOptions).where(eq(addOnOptions.name, addOnName)).get()
        if (addOn && addOn.stock !== null) {
          await db.update(addOnOptions).set({ stock: Math.max(0, addOn.stock - line.count) }).where(eq(addOnOptions.id, addOn.id))
        }
      }
    }
  }
}

/** 每消費這麼多元累加 1 點——最基礎的固定比例規則，見 @pos/contract 的 memberSchema 說明。 */
const POINTS_PER_CURRENCY_UNIT = 10

// 確認用戶端送來的 memberId 真的對應存在的會員。orders.memberId 有
// 外鍵約束，存入無效參照會讓整筆訂單 insert 失敗，因此送單當下先確認，
// 找不到就當成沒有掛會員（回傳 null）而不是讓整筆訂單失敗。
async function resolveMemberId(db: AnyDb, memberId: string | undefined): Promise<string | null> {
  if (!memberId) return null
  const member = await db.select().from(members).where(eq(members.id, memberId)).get()
  return member ? member.id : null
}

/** 送單成功後，如果這筆訂單掛了會員，依實付金額累加點數。memberId 這裡已經是 resolveMemberId() 確認過存在的。 */
async function accrueMemberPoints(db: AnyDb, memberId: string | null, orderPaymentPrice: number): Promise<void> {
  if (!memberId) return
  const member = await db.select().from(members).where(eq(members.id, memberId)).get()
  if (!member) return
  const earned = Math.floor(orderPaymentPrice / POINTS_PER_CURRENCY_UNIT)
  if (earned <= 0) return
  await db.update(members).set({ points: member.points + earned }).where(eq(members.id, memberId))
}

// 用戶端只送「套用了哪張」，實際折抵金額查真正的折價券資料重算，不
// 信任用戶端算好的數字。折抵後金額不會是負的。
async function resolveOrderPayment(
  db: AnyDb,
  appliedCoupon: AppliedCoupon,
  orderTotalPrice: number,
): Promise<{ orderPaymentPrice: number; discountName: string } | { error: string }> {
  if (appliedCoupon.type === 'none') {
    return { orderPaymentPrice: orderTotalPrice, discountName: '無' }
  }
  const coupon = await db.select().from(orderCoupons).where(eq(orderCoupons.id, appliedCoupon.couponId)).get()
  if (!coupon) return { error: '找不到這張折價券' }
  const orderPaymentPrice =
    coupon.kind === 'amount'
      ? Math.max(0, orderTotalPrice - coupon.value)
      : Math.max(0, Math.round(orderTotalPrice * coupon.value))
  return { orderPaymentPrice, discountName: coupon.name }
}

// 驗證混合支付金額總和並算出找零，不信任用戶端自己算的合計。
function validateTenders(
  tenders: readonly TenderInput[],
  orderPaymentPrice: number,
): { changeDue: number } | { error: string } {
  const totalTendered = tenders.reduce((sum, tender) => sum + tender.amount, 0)
  if (totalTendered !== orderPaymentPrice) {
    return { error: `付款金額總和（${totalTendered}）與應付金額（${orderPaymentPrice}）不符` }
  }
  const changeDue = tenders.reduce((sum, tender) => sum + ((tender.receivedAmount ?? tender.amount) - tender.amount), 0)
  return { changeDue }
}

export const orderRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createOrderRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).get()
    if (existing) {
      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, existing.orderId)).all()
      const existingTenders = await db.select().from(orderTenders).where(eq(orderTenders.orderId, existing.orderId)).all()
      const existingRefunds = await db.select().from(orderRefunds).where(eq(orderRefunds.orderId, existing.orderId)).all()
      return c.json(toOrderResponse(existing, lines, existingTenders, existingRefunds), 200)
    }

    // 序號核發之後，如果下面的 insert 因為其他原因失敗，這個序號就浪費
    // 掉了（不會被回收重用）——序號中間有空隙是可以接受的，序號撞號
    // （見 nextOrderSequence 的說明）不行。
    const sequence = await nextOrderSequence(db, input.businessDate)
    const orderId = `${input.businessDate}${sequence}`

    const quickDiscountsNow = await loadQuickDiscounts(db)
    const pricedLines = input.lines.map((line) => {
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        line,
        quickDiscountsNow,
      )
      return { ...line, ...priced }
    })

    const orderTotalPrice = pricedLines.reduce((sum, line) => sum + line.totalPrice, 0) + input.bagCount
    const payment = await resolveOrderPayment(db, input.appliedCoupon, orderTotalPrice)
    if ('error' in payment) {
      return c.json({ error: payment.error }, 400)
    }
    const { orderPaymentPrice, discountName } = payment

    const tenderResult = validateTenders(input.tenders, orderPaymentPrice)
    if ('error' in tenderResult) {
      return c.json({ error: tenderResult.error }, 400)
    }
    const { changeDue } = tenderResult

    const orderDiscount = orderTotalPrice - orderPaymentPrice
    const orderCupCount = pricedLines.reduce((sum, line) => sum + line.count, 0)
    const orderTime = new Date().toISOString()
    // 顯示用摘要：多筆 tender 用頓號連接（見 db/schema.ts 的 orders.orderPayment）。
    const orderPayment = input.tenders.map((tender) => tender.method).join('、')

    // 每筆訂單一律開立發票（不管有沒有帶載具）。字軌用完或未啟用是可
    // 預期的商業狀況，回 400 顯示清楚錯誤，不是沒說明原因的 500。
    let invoiceNumber: string
    try {
      invoiceNumber = await nextInvoiceNumber(db)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : '核發發票號碼失敗' }, 400)
    }
    const memberId = await resolveMemberId(db, input.memberId)

    const newOrder: OrderRow = {
      orderId,
      orderTime,
      orderStatus: '已完成',
      orderChannel: input.orderChannel,
      staff: input.staff,
      orderBagCount: input.bagCount,
      orderCupCount,
      orderTotalPrice,
      orderPayment,
      orderDiscount,
      orderPaymentPrice,
      changeDue,
      discountName,
      idempotencyKey: input.idempotencyKey,
      createdAt: orderTime,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
      invoiceNumber,
      invoiceCarrierType: input.invoiceCarrier.type,
      invoiceCarrierValue: input.invoiceCarrier.type === '無載具' ? null : input.invoiceCarrier.value,
      memberId,
      invoiceStatus: 'issued',
      invoiceSubmittedAt: null,
      // 純紀錄用途，不像 memberId 需要驗證存在性（不是外鍵，只是字串）。
      tableNumber: input.tableNumber ?? null,
      note: input.note?.trim() || null,
    }
    const newTenders: Omit<OrderTenderRow, 'id'>[] = input.tenders.map((tender, seq) => ({
      orderId,
      seq,
      method: tender.method,
      amount: tender.amount,
      receivedAmount: tender.receivedAmount ?? null,
    }))

    // 刻意不用 db.transaction()：better-sqlite3 要求同步回呼、D1 的
    // batch() 要求非同步，兩者簽章不同、無法透過 AnyDb 泛型統一呼叫，
    // 這幾個 insert 因此不是原子的——之後要在 D1 上補回原子性，走 D1
    // 專屬的 db.batch()。
    await db.insert(orders).values(newOrder)
    await db.insert(orderLines).values(pricedLines.map((line) => ({ ...line, orderId })))
    await db.insert(orderTenders).values(newTenders)
    // 只在真的新建立訂單時扣庫存、累加點數；idempotencyKey 命中走上面
    // 提早 return 的路徑，不會重複執行。
    await deductStock(db, input.lines)
    await accrueMemberPoints(db, memberId, orderPaymentPrice)

    const insertedLines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    const insertedTenders = await db.select().from(orderTenders).where(eq(orderTenders.orderId, orderId)).all()
    return c.json(toOrderResponse(newOrder, insertedLines, insertedTenders, []), 201)
  })
  .openapi(listOrdersRoute, async (c) => {
    const db = c.get('db')
    const allOrders = await db.select().from(orders).all()
    const allLines = await db.select().from(orderLines).all()
    const allTenders = await db.select().from(orderTenders).all()
    const allRefunds = await db.select().from(orderRefunds).all()

    const linesByOrder = new Map<string, OrderLineRow[]>()
    for (const line of allLines) {
      const list = linesByOrder.get(line.orderId) ?? []
      list.push(line)
      linesByOrder.set(line.orderId, list)
    }
    const tendersByOrder = new Map<string, OrderTenderRow[]>()
    for (const tender of allTenders) {
      const list = tendersByOrder.get(tender.orderId) ?? []
      list.push(tender)
      tendersByOrder.set(tender.orderId, list)
    }
    const refundsByOrder = new Map<string, OrderRefundRow[]>()
    for (const refund of allRefunds) {
      const list = refundsByOrder.get(refund.orderId) ?? []
      list.push(refund)
      refundsByOrder.set(refund.orderId, list)
    }

    return c.json(
      allOrders.map((order) =>
        toOrderResponse(
          order,
          linesByOrder.get(order.orderId) ?? [],
          tendersByOrder.get(order.orderId) ?? [],
          refundsByOrder.get(order.orderId) ?? [],
        ),
      ),
      200,
    )
  })
  .openapi(updateOrderStatusRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const { orderStatus, operator, reason } = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.orderId, orderId)).get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    // 改成「已取消」記錄作廢理由／經手人／時間；改回「已完成」清空三個欄位。
    const voidFields =
      orderStatus === '已取消'
        ? { voidReason: reason ?? null, voidedBy: operator, voidedAt: new Date().toISOString() }
        : { voidReason: null, voidedBy: null, voidedAt: null }

    // 訂單作廢時發票也一併標成作廢（真正的統一發票作廢要另外向財政部
    // 平台申報，不在本專案模擬範圍）。撤銷作廢則回到 'issued'。
    const invoiceStatusField: { invoiceStatus?: InvoiceStatus } =
      orderStatus === '已取消' ? { invoiceStatus: 'voided' } : { invoiceStatus: 'issued' }

    await db.update(orders).set({ orderStatus, ...voidFields, ...invoiceStatusField }).where(eq(orders.orderId, orderId))
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    const tenders = await db.select().from(orderTenders).where(eq(orderTenders.orderId, orderId)).all()
    const refunds = await db.select().from(orderRefunds).where(eq(orderRefunds.orderId, orderId)).all()
    return c.json(toOrderResponse({ ...existing, orderStatus, ...voidFields, ...invoiceStatusField }, lines, tenders, refunds), 200)
  })
  .openapi(createRefundRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.orderId, orderId)).get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    const existingRefunds = await db.select().from(orderRefunds).where(eq(orderRefunds.orderId, orderId)).all()

    // 冪等：同一個 refundId 重送回傳目前狀態，不重複建立退款紀錄。
    if (existingRefunds.some((refund) => refund.id === input.refundId)) {
      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
      const tenders = await db.select().from(orderTenders).where(eq(orderTenders.orderId, orderId)).all()
      return c.json(toOrderResponse(existing, lines, tenders, existingRefunds), 200)
    }

    if (existing.orderStatus === '已取消') {
      return c.json({ error: '這筆訂單已作廢，不需要另外退款' }, 400)
    }

    const { refundableAmount } = summarizeOrderRefunds(existing.orderPaymentPrice, existingRefunds)
    if (input.amount > refundableAmount) {
      return c.json({ error: `退款金額（${input.amount}）超過這筆訂單目前還能退的額度（${refundableAmount}）` }, 400)
    }

    const newRefund: OrderRefundRow = {
      id: input.refundId,
      orderId,
      amount: input.amount,
      reason: input.reason,
      operator: input.operator,
      at: new Date().toISOString(),
    }
    await db.insert(orderRefunds).values(newRefund)

    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    const tenders = await db.select().from(orderTenders).where(eq(orderTenders.orderId, orderId)).all()
    return c.json(toOrderResponse(existing, lines, tenders, [...existingRefunds, newRefund]), 201)
  })
  .openapi(deleteOrderRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const db = c.get('db')

    const existing = await db.select().from(orders).where(eq(orders.orderId, orderId)).get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    // 先刪明細再刪主檔，避免違反外鍵約束。
    await db.delete(orderLines).where(eq(orderLines.orderId, orderId))
    await db.delete(orderTenders).where(eq(orderTenders.orderId, orderId))
    await db.delete(orderRefunds).where(eq(orderRefunds.orderId, orderId))
    await db.delete(orders).where(eq(orders.orderId, orderId))
    return c.body(null, 204)
  })
