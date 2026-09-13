import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { and, desc, eq, gte, inArray, like, lte, sql } from 'drizzle-orm'
import {
  createOrderRequestSchema,
  listOrdersQuerySchema,
  orderListResponseSchema,
  orderSchema,
  orderStatusSchema,
  orderSummarySchema,
  refundInputSchema,
  type AppliedCoupon,
  type InvoiceCarrier,
  type InvoiceStatus,
  type ListOrdersQuery,
  type MemberPointLedgerReason,
  type OrderLineInput,
  type TenderInput
} from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import {
  DEFAULT_POINTS_PER_CURRENCY_UNIT,
  DEFAULT_POINTS_REDEMPTION_RATE,
  earnedPointsForPayment,
  pointsWithheldForRefundedAmount,
  priceLine,
  redemptionValueForPoints,
  summarizeOrderRefunds,
  type QuickDiscount
} from '@pos/domain'
import {
  diningTables,
  members,
  memberPointLedger,
  modifierOptions,
  orderCoupons,
  orderLines,
  orderRefunds,
  orders,
  orderTenders,
  productModifierGroups,
  products,
  quickDiscounts as quickDiscountsTable,
  users
} from '../db/schema'
import { checkCapability, requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { maybeExpireMemberPoints } from '../db/member-points'
import { tenantFilter } from '../db/tenant-scope'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

const createOrderRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: {
    body: {
      content: { 'application/json': { schema: createOrderRequestSchema } }
    }
  },
  responses: {
    200: {
      description: '訂單已存在（同一個 idempotencyKey 重送，回傳原本那筆，不會建立第二筆）',
      content: { 'application/json': { schema: orderSchema } }
    },
    201: {
      description: '訂單建立成功',
      content: { 'application/json': { schema: orderSchema } }
    },
    400: {
      description:
        '套用的折價券不存在、tenders 金額總和跟應付金額不符、沒有可用的發票字軌，或品項帶了該品項不支援的加購選項',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

const listOrdersRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: { query: listOrdersQuerySchema },
  responses: {
    200: {
      description: '訂單清單（分頁）',
      content: { 'application/json': { schema: orderListResponseSchema } }
    }
  }
})

const orderSummaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '訂單 KPI 摘要與服務人員名單',
      content: { 'application/json': { schema: orderSummarySchema } }
    }
  }
})

const errorSchema = z.object({ error: z.string() })

const updateOrderStatusRequestSchema = z
  .object({
    orderStatus: orderStatusSchema,
    operator: z.string().min(1),
    reason: z.string().min(1).optional()
  })
  .refine((data) => data.orderStatus !== '已取消' || data.reason !== undefined, {
    message: '作廢訂單必須填寫原因',
    path: ['reason']
  })

const updateOrderStatusRoute = createRoute({
  method: 'patch',
  path: '/{orderId}/status',
  middleware: [requireDeviceToken] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateOrderStatusRequestSchema } } }
  },
  responses: {
    200: {
      description: '訂單狀態更新成功',
      content: { 'application/json': { schema: orderSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏、或缺少操作員身分',
      content: { 'application/json': { schema: errorSchema } }
    },
    403: {
      description: '這個帳號沒有執行此操作的權限',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } }
  }
})

const createRefundRoute = createRoute({
  method: 'post',
  path: '/{orderId}/refunds',
  middleware: [requireDeviceToken, requireCapability('canRefundOrVoid')] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
    body: { content: { 'application/json': { schema: refundInputSchema } } }
  },
  responses: {
    200: {
      description: '這個 refundId 已經退過款（冪等），回傳目前的訂單狀態',
      content: { 'application/json': { schema: orderSchema } }
    },
    201: { description: '退款成功', content: { 'application/json': { schema: orderSchema } } },
    400: {
      description: '這筆訂單已作廢，或退款金額超過目前還能退的額度',
      content: { 'application/json': { schema: errorSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } }
  }
})

// 實體刪除整筆訂單與關聯明細，非軟刪除
const deleteOrderRoute = createRoute({
  method: 'delete',
  path: '/{orderId}',
  middleware: [requireDeviceToken, requireCapability('canDeleteOrder')] as const,
  request: {
    params: z.object({ orderId: z.string().min(1) })
  },
  responses: {
    204: { description: '訂單已刪除' },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: { description: '找不到這筆訂單', content: { 'application/json': { schema: errorSchema } } }
  }
})

type OrderRow = typeof orders.$inferSelect
type OrderLineRow = typeof orderLines.$inferSelect
type OrderTenderRow = typeof orderTenders.$inferSelect
type OrderRefundRow = typeof orderRefunds.$inferSelect

function toOrderResponse(
  order: OrderRow,
  lines: OrderLineRow[],
  tenders: OrderTenderRow[],
  refunds: OrderRefundRow[],
  member: { name: string; phone: string } | null
) {
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
      at: refund.at
    })),
    refundedAmount,
    voidReason: order.voidReason,
    voidedBy: order.voidedBy,
    voidedAt: order.voidedAt,
    invoiceNumber: order.invoiceNumber,
    invoiceCarrier: toInvoiceCarrier(order.invoiceCarrierType, order.invoiceCarrierValue),
    memberId: order.memberId,
    memberName: member?.name ?? null,
    memberPhone: member?.phone ?? null,
    pointsEarned: order.pointsEarned,
    pointsRedeemed: order.pointsRedeemed,
    invoiceStatus: order.invoiceStatus,
    invoiceSubmittedAt: order.invoiceSubmittedAt,
    tableNumber: order.tableNumber,
    note: order.note,
    tenders: [...tenders]
      .sort((a, b) => a.seq - b.seq)
      .map((tender) => ({
        method: tender.method,
        amount: tender.amount,
        ...(tender.receivedAmount === null ? {} : { receivedAmount: tender.receivedAmount })
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
      quickDiscountName: line.quickDiscountName
    }))
  })
}

async function loadQuickDiscounts(db: AnyDb, tenantId: string | null): Promise<QuickDiscount[]> {
  const rows = await db
    .select()
    .from(quickDiscountsTable)
    .where(tenantFilter(quickDiscountsTable.tenantId, tenantId))
    .all()
  return rows.map((row) => ({ id: row.id, name: row.name, kind: row.kind, value: row.value }))
}

async function nextOrderSequence(
  db: AnyDb,
  tenantId: string | null,
  businessDate: string
): Promise<number> {
  // 子查詢不濾租戶以確保全域唯一的訂單序號不衝突；欄位名稱維持不限定以符 SQLite 語法
  const row = await db.get<{ counter: number }>(sql`
    insert into order_sequences (tenant_id, business_date, counter)
    values (
      ${tenantId},
      ${businessDate},
      coalesce(
        (select max(cast(substr(order_id, 9) as integer))
         from orders where order_id like ${businessDate} || '%'),
        0
      ) + 1
    )
    on conflict (tenant_id, business_date) do update set counter = counter + 1
    returning counter
  `)
  if (!row) {
    throw new Error(`核發訂單序號失敗（businessDate=${businessDate}）`)
  }
  return row.counter
}

async function nextInvoiceNumber(db: AnyDb, tenantId: string | null): Promise<string> {
  // 使用 IS 以便在 tenantId 為 null 時能正確比對 null
  const row = await db.get<{ trackCode: string; currentNumber: number }>(sql`
    update invoice_tracks
    set current_number = current_number + 1
    where is_active = 1 and current_number < range_end and tenant_id is ${tenantId}
    returning track_code as trackCode, current_number as currentNumber
  `)
  if (!row) {
    throw new Error(
      '沒有可用的發票字軌（沒有啟用中的字軌，或號碼已用完），請先在後台設定電子發票字軌'
    )
  }
  return `${row.trackCode}${String(row.currentNumber).padStart(8, '0')}`
}

function toInvoiceCarrier(type: InvoiceCarrier['type'], value: string | null): InvoiceCarrier {
  if (type === '無載具') return { type }
  return { type, value: value ?? '' }
}

function baseProductName(name: string): string {
  return name.split(',')[0]?.trim() ?? name
}

// 以品名比對扣減庫存至 0 為止，目前不阻擋超賣
async function deductStock(
  db: AnyDb,
  tenantId: string | null,
  lines: Pick<OrderLineInput, 'name' | 'count' | 'addList'>[]
): Promise<void> {
  for (const line of lines) {
    const productName = baseProductName(line.name)
    const item = await db
      .select()
      .from(products)
      .where(and(eq(products.name, productName), tenantFilter(products.tenantId, tenantId)))
      .get()
    if (item && item.stock !== null) {
      await db
        .update(products)
        .set({ stock: Math.max(0, item.stock - line.count) })
        .where(eq(products.id, item.id))
    }
    if (Array.isArray(line.addList)) {
      for (const addOnName of line.addList) {
        const option = await db
          .select()
          .from(modifierOptions)
          .where(
            and(eq(modifierOptions.name, addOnName), tenantFilter(modifierOptions.tenantId, tenantId))
          )
          .get()
        if (option && option.stock !== null) {
          await db
            .update(modifierOptions)
            .set({ stock: Math.max(0, option.stock - line.count) })
            .where(eq(modifierOptions.id, option.id))
        }
      }
    }
  }
}

// 依品名前半段回查品項校驗配料選項，無對應品項則放行
async function findIllegalAddOns(
  db: AnyDb,
  tenantId: string | null,
  line: Pick<OrderLineInput, 'name' | 'addList'>
): Promise<string[] | null> {
  if (!Array.isArray(line.addList) || line.addList.length === 0) return null

  const productName = baseProductName(line.name)
  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.name, productName), tenantFilter(products.tenantId, tenantId)))
    .get()
  if (!product) return null

  const groupRows = await db
    .select({ groupId: productModifierGroups.groupId })
    .from(productModifierGroups)
    .where(eq(productModifierGroups.productId, product.id))
    .all()
  const legalNames = new Set<string>()
  if (groupRows.length > 0) {
    const optionRows = await db
      .select({ name: modifierOptions.name })
      .from(modifierOptions)
      .where(inArray(modifierOptions.groupId, groupRows.map((row) => row.groupId)))
      .all()
    for (const option of optionRows) legalNames.add(option.name)
  }
  return line.addList.filter((name) => !legalNames.has(name))
}

// 預先校驗會員存在性以避免外鍵錯誤，查無會員時視為未帶會員
async function resolveMemberId(
  db: AnyDb,
  tenantId: string | null,
  memberId: string | undefined
): Promise<string | null> {
  if (!memberId) return null
  const member = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), tenantFilter(members.tenantId, tenantId)))
    .get()
  if (!member) return null
  await maybeExpireMemberPoints(db, tenantId, member)
  return member.id
}

// 查詢會員資訊供回應使用，軟刪除之會員仍予回傳以維持歷史關聯
async function resolveMemberDisplay(
  db: AnyDb,
  tenantId: string | null,
  memberId: string | null
): Promise<{ name: string; phone: string } | null> {
  if (!memberId) return null
  const member = await db
    .select({ name: members.name, phone: members.phone })
    .from(members)
    .where(and(eq(members.id, memberId), tenantFilter(members.tenantId, tenantId)))
    .get()
  return member ?? null
}

async function resolvePointsPerCurrencyUnit(db: AnyDb, tenantId: string | null): Promise<number> {
  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  return tenant?.pointsPerCurrencyUnit ?? DEFAULT_POINTS_PER_CURRENCY_UNIT
}

async function resolvePointsRedemptionRate(db: AnyDb, tenantId: string | null): Promise<number> {
  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  return tenant?.pointsRedemptionRate ?? DEFAULT_POINTS_REDEMPTION_RATE
}

// 結帳自動連動桌況：僅更新既有桌位，已入座桌位保留原入座時間
async function syncTableOnCheckout(
  db: AnyDb,
  tenantId: string | null,
  tableNumber: string,
  guestCount: number | undefined
): Promise<void> {
  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  if (tenant && !tenant.autoOccupyTableOnCheckout) return

  const table = await db
    .select()
    .from(diningTables)
    .where(and(eq(diningTables.tableNumber, tableNumber), tenantFilter(diningTables.tenantId, tenantId)))
    .get()
  if (!table) return

  if (table.status === 'occupied') {
    if (guestCount !== undefined) {
      await db.update(diningTables).set({ guestCount }).where(eq(diningTables.id, table.id))
    }
    return
  }

  await db
    .update(diningTables)
    .set({
      status: 'occupied',
      occupiedAt: new Date().toISOString(),
      guestCount: guestCount ?? table.guestCount ?? null,
      reservationPhone: null,
      reservationTime: null
    })
    .where(eq(diningTables.id, table.id))
}

// 資料庫端原子計算點數避免並發覆蓋，並寫入異動歷程帳本
async function adjustMemberPoints(
  db: AnyDb,
  tenantId: string | null,
  memberId: string | null,
  delta: number,
  reason: MemberPointLedgerReason,
  orderId: string | null = null
): Promise<void> {
  if (!memberId || delta === 0) return
  const nextPoints =
    delta > 0 ? sql`${members.points} + ${delta}` : sql`MAX(0, ${members.points} + ${delta})`
  await db
    .update(members)
    .set({ points: nextPoints })
    .where(and(eq(members.id, memberId), tenantFilter(members.tenantId, tenantId)))
  await db.insert(memberPointLedger).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId,
    delta,
    reason,
    orderId,
    operator: null,
    note: null,
    createdAt: new Date().toISOString()
  })
}

// 依原訂單比例計算尚未被退款收回之剩餘點數
function remainingReversiblePoints(
  pointsEarned: number,
  orderPaymentPrice: number,
  refunds: readonly { amount: number }[]
): number {
  const refundedAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0)
  const alreadyWithheld = pointsWithheldForRefundedAmount(
    pointsEarned,
    orderPaymentPrice,
    refundedAmount
  )
  return pointsEarned - alreadyWithheld
}

async function resolveOrderPayment(
  db: AnyDb,
  tenantId: string | null,
  appliedCoupon: AppliedCoupon,
  orderTotalPrice: number
): Promise<{ orderPaymentPrice: number; discountName: string } | { error: string }> {
  if (appliedCoupon.type === 'none') {
    return { orderPaymentPrice: orderTotalPrice, discountName: '無' }
  }
  const coupon = await db
    .select()
    .from(orderCoupons)
    .where(and(eq(orderCoupons.id, appliedCoupon.couponId), tenantFilter(orderCoupons.tenantId, tenantId)))
    .get()
  if (!coupon) return { error: '找不到這張折價券' }
  const orderPaymentPrice =
    coupon.kind === 'amount'
      ? Math.max(0, orderTotalPrice - coupon.value)
      : Math.max(0, Math.round(orderTotalPrice * coupon.value))
  return { orderPaymentPrice, discountName: coupon.name }
}

function validateTenders(
  tenders: readonly TenderInput[],
  orderPaymentPrice: number
): { changeDue: number } | { error: string } {
  const totalTendered = tenders.reduce((sum, tender) => sum + tender.amount, 0)
  if (totalTendered !== orderPaymentPrice) {
    return { error: `付款金額總和（${totalTendered}）與應付金額（${orderPaymentPrice}）不符` }
  }
  const changeDue = tenders.reduce(
    (sum, tender) => sum + ((tender.receivedAmount ?? tender.amount) - tender.amount),
    0
  )
  return { changeDue }
}

function buildOrderFilters(query: Pick<ListOrdersQuery, keyof ListOrdersQuery>) {
  const conditions = []
  if (query.keyword) conditions.push(like(orders.orderId, `%${query.keyword}%`))
  if (query.dateFrom) conditions.push(gte(orders.orderTime, query.dateFrom))
  // 補齊時間至當日結束以包含整天訂單
  if (query.dateTo) conditions.push(lte(orders.orderTime, `${query.dateTo}T23:59:59.999Z`))
  if (query.channel) conditions.push(eq(orders.orderChannel, query.channel))
  if (query.staff) conditions.push(eq(orders.staff, query.staff))
  if (query.status) conditions.push(eq(orders.orderStatus, query.status))
  if (query.payMethod) conditions.push(like(orders.orderPayment, `%${query.payMethod}%`))
  return conditions.length > 0 ? and(...conditions) : undefined
}

export const orderRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createOrderRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(orders)
      .where(
        and(eq(orders.idempotencyKey, input.idempotencyKey), tenantFilter(orders.tenantId, tenantId))
      )
      .get()
    if (existing) {
      const lines = await db
        .select()
        .from(orderLines)
        .where(eq(orderLines.orderId, existing.orderId))
        .all()
      const existingTenders = await db
        .select()
        .from(orderTenders)
        .where(eq(orderTenders.orderId, existing.orderId))
        .all()
      const existingRefunds = await db
        .select()
        .from(orderRefunds)
        .where(eq(orderRefunds.orderId, existing.orderId))
        .all()
      const member = await resolveMemberDisplay(db, tenantId, existing.memberId)
      return c.json(toOrderResponse(existing, lines, existingTenders, existingRefunds, member), 200)
    }

    for (const line of input.lines) {
      const illegal = await findIllegalAddOns(db, tenantId, line)
      if (illegal && illegal.length > 0) {
        return c.json(
          { error: `品項「${line.name.split(',')[0]?.trim() ?? line.name}」不支援這些加購選項：${illegal.join('、')}` },
          400
        )
      }
    }

    const sequence = await nextOrderSequence(db, tenantId, input.businessDate)
    const orderId = `${input.businessDate}${sequence}`

    const quickDiscountsNow = await loadQuickDiscounts(db, tenantId)
    const pricedLines = input.lines.map((line) => {
      const priced = priceLine(
        { price: line.price, count: line.count, addListPrice: line.addListPrice },
        line,
        quickDiscountsNow
      )
      return { ...line, ...priced }
    })

    const orderTotalPrice =
      pricedLines.reduce((sum, line) => sum + line.totalPrice, 0) + input.bagCount
    const payment = await resolveOrderPayment(db, tenantId, input.appliedCoupon, orderTotalPrice)
    if ('error' in payment) {
      return c.json({ error: payment.error }, 400)
    }
    let orderPaymentPrice = payment.orderPaymentPrice
    let discountName = payment.discountName

    const memberId = await resolveMemberId(db, tenantId, input.memberId)

    const pointsToRedeem = memberId ? (input.pointsToRedeem ?? 0) : 0
    if (pointsToRedeem > 0) {
      const redeemingMember = await db
        .select()
        .from(members)
        .where(and(eq(members.id, memberId as string), tenantFilter(members.tenantId, tenantId)))
        .get()
      if (!redeemingMember || pointsToRedeem > redeemingMember.points) {
        return c.json(
          {
            error: `折抵點數（${pointsToRedeem}）超過會員目前點數（${redeemingMember?.points ?? 0}）`
          },
          400
        )
      }
      const redemptionValue = redemptionValueForPoints(
        pointsToRedeem,
        await resolvePointsRedemptionRate(db, tenantId)
      )
      if (redemptionValue > orderPaymentPrice) {
        return c.json(
          { error: `折抵金額（${redemptionValue}）超過應付金額（${orderPaymentPrice}）` },
          400
        )
      }
      orderPaymentPrice -= redemptionValue
      discountName = discountName === '無' ? '點數折抵' : `${discountName}、點數折抵`
    }

    const tenderResult = validateTenders(input.tenders, orderPaymentPrice)
    if ('error' in tenderResult) {
      return c.json({ error: tenderResult.error }, 400)
    }
    const { changeDue } = tenderResult

    const orderDiscount = orderTotalPrice - orderPaymentPrice
    const orderCupCount = pricedLines.reduce((sum, line) => sum + line.count, 0)
    const orderTime = new Date().toISOString()
    const orderPayment = input.tenders.map((tender) => tender.method).join('、')

    let invoiceNumber: string
    try {
      invoiceNumber = await nextInvoiceNumber(db, tenantId)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : '核發發票號碼失敗' }, 400)
    }
    const pointsEarned = memberId
      ? earnedPointsForPayment(orderPaymentPrice, await resolvePointsPerCurrencyUnit(db, tenantId))
      : 0

    const newOrder: OrderRow = {
      orderId,
      tenantId,
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
      invoiceCarrierValue:
        input.invoiceCarrier.type === '無載具' ? null : input.invoiceCarrier.value,
      memberId,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
      invoiceStatus: 'issued',
      invoiceSubmittedAt: null,
      tableNumber: input.tableNumber ?? null,
      note: input.note?.trim() || null
    }
    const newTenders: Omit<OrderTenderRow, 'id'>[] = input.tenders.map((tender, seq) => ({
      orderId,
      tenantId,
      seq,
      method: tender.method,
      amount: tender.amount,
      receivedAmount: tender.receivedAmount ?? null
    }))

    // better-sqlite3 與 D1 batch 非同步 API 簽章不相容，此處跨表寫入暫未包交易
    await db.insert(orders).values(newOrder)
    await db.insert(orderLines).values(pricedLines.map((line) => ({ ...line, orderId })))
    await db.insert(orderTenders).values(newTenders)
    await deductStock(db, tenantId, input.lines)
    await adjustMemberPoints(db, tenantId, memberId, pointsEarned, 'order_accrual', orderId)
    await adjustMemberPoints(db, tenantId, memberId, -pointsToRedeem, 'redemption', orderId)
    if (input.orderChannel === '內用' && input.tableNumber) {
      await syncTableOnCheckout(db, tenantId, input.tableNumber, input.guestCount)
    }

    const insertedLines = await db
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, orderId))
      .all()
    const insertedTenders = await db
      .select()
      .from(orderTenders)
      .where(eq(orderTenders.orderId, orderId))
      .all()
    const member = await resolveMemberDisplay(db, tenantId, memberId)
    return c.json(toOrderResponse(newOrder, insertedLines, insertedTenders, [], member), 201)
  })
  .openapi(listOrdersRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const query = c.req.valid('query')
    const filters = buildOrderFilters(query)
    const where = filters
      ? and(filters, tenantFilter(orders.tenantId, tenantId))
      : tenantFilter(orders.tenantId, tenantId)

    const [totalRow, pageOrders] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(where)
        .get(),
      db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.orderTime))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .all()
    ])
    const totalCount = totalRow?.count ?? 0

    const pageOrderIds = pageOrders.map((order) => order.orderId)
    const pageMemberIds = [...new Set(pageOrders.map((order) => order.memberId).filter((id) => id !== null))]
    const [pageLines, pageTenders, pageRefunds, pageMembers] = await Promise.all([
      pageOrderIds.length > 0
        ? db.select().from(orderLines).where(inArray(orderLines.orderId, pageOrderIds)).all()
        : [],
      pageOrderIds.length > 0
        ? db.select().from(orderTenders).where(inArray(orderTenders.orderId, pageOrderIds)).all()
        : [],
      pageOrderIds.length > 0
        ? db.select().from(orderRefunds).where(inArray(orderRefunds.orderId, pageOrderIds)).all()
        : [],
      pageMemberIds.length > 0
        ? db
            .select({ id: members.id, name: members.name, phone: members.phone })
            .from(members)
            .where(inArray(members.id, pageMemberIds))
            .all()
        : []
    ])
    const memberById = new Map(pageMembers.map((member) => [member.id, member]))

    const linesByOrder = new Map<string, OrderLineRow[]>()
    for (const line of pageLines) {
      const list = linesByOrder.get(line.orderId) ?? []
      list.push(line)
      linesByOrder.set(line.orderId, list)
    }
    const tendersByOrder = new Map<string, OrderTenderRow[]>()
    for (const tender of pageTenders) {
      const list = tendersByOrder.get(tender.orderId) ?? []
      list.push(tender)
      tendersByOrder.set(tender.orderId, list)
    }
    const refundsByOrder = new Map<string, OrderRefundRow[]>()
    for (const refund of pageRefunds) {
      const list = refundsByOrder.get(refund.orderId) ?? []
      list.push(refund)
      refundsByOrder.set(refund.orderId, list)
    }

    return c.json(
      {
        items: pageOrders.map((order) =>
          toOrderResponse(
            order,
            linesByOrder.get(order.orderId) ?? [],
            tendersByOrder.get(order.orderId) ?? [],
            refundsByOrder.get(order.orderId) ?? [],
            (order.memberId && memberById.get(order.memberId)) || null
          )
        ),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / query.pageSize))
        }
      },
      200
    )
  })
  .openapi(orderSummaryRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const tenantCond = tenantFilter(orders.tenantId, tenantId)

    const [totals, completedRefundRow, refundCountRow, staffRows] = await Promise.all([
      db
        .select({
          totalCount: sql<number>`count(*)`,
          completedCount: sql<number>`sum(case when ${orders.orderStatus} = '已完成' then 1 else 0 end)`,
          voidCount: sql<number>`sum(case when ${orders.orderStatus} = '已取消' then 1 else 0 end)`,
          completedPaymentTotal: sql<number>`sum(case when ${orders.orderStatus} = '已完成' then ${orders.orderPaymentPrice} else 0 end)`
        })
        .from(orders)
        .where(tenantCond)
        .get(),
      db
        .select({ total: sql<number>`coalesce(sum(${orderRefunds.amount}), 0)` })
        .from(orderRefunds)
        .innerJoin(orders, eq(orders.orderId, orderRefunds.orderId))
        .where(and(eq(orders.orderStatus, '已完成'), tenantCond))
        .get(),
      db.get<{ count: number }>(sql`
        select count(*) as count from (
          select ${orderRefunds.orderId} from ${orderRefunds}
          where ${orderRefunds.tenantId} is ${tenantId}
          group by ${orderRefunds.orderId}
          having sum(${orderRefunds.amount}) > 0
        )
      `),
      db.select({ staff: orders.staff }).from(orders).where(tenantCond).groupBy(orders.staff).all()
    ])

    return c.json(
      {
        totalCount: totals?.totalCount ?? 0,
        totalRevenue: (totals?.completedPaymentTotal ?? 0) - (completedRefundRow?.total ?? 0),
        completedCount: totals?.completedCount ?? 0,
        voidCount: totals?.voidCount ?? 0,
        refundCount: refundCountRow?.count ?? 0,
        staffNames: staffRows.map((row) => row.staff).sort()
      },
      200
    )
  })
  .openapi(updateOrderStatusRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const { orderStatus, operator, reason } = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    // 作廢訂單需 canRefundOrVoid 權限，其餘狀態更新需 canEditOrderStatus
    const capabilityCheck = await checkCapability(
      c,
      orderStatus === '已取消' ? 'canRefundOrVoid' : 'canEditOrderStatus'
    )
    if (!capabilityCheck.ok)
      return c.json({ error: capabilityCheck.message }, capabilityCheck.status)

    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderId, orderId), tenantFilter(orders.tenantId, tenantId)))
      .get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    const voidFields =
      orderStatus === '已取消'
        ? { voidReason: reason ?? null, voidedBy: operator, voidedAt: new Date().toISOString() }
        : { voidReason: null, voidedBy: null, voidedAt: null }

    const invoiceStatusField: { invoiceStatus?: InvoiceStatus } =
      orderStatus === '已取消' ? { invoiceStatus: 'voided' } : { invoiceStatus: 'issued' }

    await db
      .update(orders)
      .set({ orderStatus, ...voidFields, ...invoiceStatusField })
      .where(eq(orders.orderId, orderId))
    if (orderStatus === '已取消') {
      await recordAuditLog(
        c,
        'order.void',
        `作廢訂單「${orderId}」（原因：${reason ?? '未填寫'}）`
      )
    }
    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    const tenders = await db
      .select()
      .from(orderTenders)
      .where(eq(orderTenders.orderId, orderId))
      .all()
    const refunds = await db
      .select()
      .from(orderRefunds)
      .where(eq(orderRefunds.orderId, orderId))
      .all()

    // 作廢或撤銷作廢時等額處理尚未被退款收回之會員點數
    if (existing.memberId && orderStatus !== existing.orderStatus) {
      const remaining = remainingReversiblePoints(existing.pointsEarned, existing.orderPaymentPrice, refunds)
      if (orderStatus === '已取消') {
        await adjustMemberPoints(db, tenantId, existing.memberId, -remaining, 'void_reversal', orderId)
        await adjustMemberPoints(
          db,
          tenantId,
          existing.memberId,
          existing.pointsRedeemed,
          'redemption_refund',
          orderId
        )
      } else if (existing.orderStatus === '已取消') {
        await adjustMemberPoints(db, tenantId, existing.memberId, remaining, 'restore_award', orderId)
        await adjustMemberPoints(
          db,
          tenantId,
          existing.memberId,
          -existing.pointsRedeemed,
          'redemption',
          orderId
        )
      }
    }

    const member = await resolveMemberDisplay(db, tenantId, existing.memberId)
    return c.json(
      toOrderResponse(
        { ...existing, orderStatus, ...voidFields, ...invoiceStatusField },
        lines,
        tenders,
        refunds,
        member
      ),
      200
    )
  })
  .openapi(createRefundRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderId, orderId), tenantFilter(orders.tenantId, tenantId)))
      .get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    const existingRefunds = await db
      .select()
      .from(orderRefunds)
      .where(eq(orderRefunds.orderId, orderId))
      .all()

    if (existingRefunds.some((refund) => refund.id === input.refundId)) {
      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
      const tenders = await db
        .select()
        .from(orderTenders)
        .where(eq(orderTenders.orderId, orderId))
        .all()
      const member = await resolveMemberDisplay(db, tenantId, existing.memberId)
      return c.json(toOrderResponse(existing, lines, tenders, existingRefunds, member), 200)
    }

    if (existing.orderStatus === '已取消') {
      return c.json({ error: '這筆訂單已作廢，不需要另外退款' }, 400)
    }

    const { refundableAmount } = summarizeOrderRefunds(existing.orderPaymentPrice, existingRefunds)
    if (input.amount > refundableAmount) {
      return c.json(
        { error: `退款金額（${input.amount}）超過這筆訂單目前還能退的額度（${refundableAmount}）` },
        400
      )
    }

    const newRefund: OrderRefundRow = {
      id: input.refundId,
      tenantId,
      orderId,
      amount: input.amount,
      reason: input.reason,
      operator: input.operator,
      at: new Date().toISOString()
    }
    await db.insert(orderRefunds).values(newRefund)
    await recordAuditLog(
      c,
      'order.refund',
      `訂單「${orderId}」退款 ${input.amount} 元（原因：${input.reason}）`
    )

    if (existing.memberId) {
      const before = pointsWithheldForRefundedAmount(
        existing.pointsEarned,
        existing.orderPaymentPrice,
        existingRefunds.reduce((sum, refund) => sum + refund.amount, 0)
      )
      const after = pointsWithheldForRefundedAmount(
        existing.pointsEarned,
        existing.orderPaymentPrice,
        existingRefunds.reduce((sum, refund) => sum + refund.amount, 0) + input.amount
      )
      await adjustMemberPoints(db, tenantId, existing.memberId, before - after, 'refund_reversal', orderId)
    }

    const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, orderId)).all()
    const tenders = await db
      .select()
      .from(orderTenders)
      .where(eq(orderTenders.orderId, orderId))
      .all()
    const member = await resolveMemberDisplay(db, tenantId, existing.memberId)
    return c.json(
      toOrderResponse(existing, lines, tenders, [...existingRefunds, newRefund], member),
      201
    )
  })
  .openapi(deleteOrderRoute, async (c) => {
    const { orderId } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderId, orderId), tenantFilter(orders.tenantId, tenantId)))
      .get()
    if (!existing) {
      return c.json({ error: '找不到這筆訂單' }, 404)
    }

    // 先刪明細再刪主檔，防範外鍵約束衝突
    await db.delete(orderLines).where(eq(orderLines.orderId, orderId))
    await db.delete(orderTenders).where(eq(orderTenders.orderId, orderId))
    await db.delete(orderRefunds).where(eq(orderRefunds.orderId, orderId))
    await db.delete(orders).where(eq(orders.orderId, orderId))
    await recordAuditLog(c, 'order.delete', `刪除訂單「${orderId}」`)
    return c.body(null, 204)
  })
