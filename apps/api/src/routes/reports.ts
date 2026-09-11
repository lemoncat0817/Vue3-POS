import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { salesReportQuerySchema, salesReportSchema } from '@pos/contract'
import { requireDeviceToken } from '../middleware/require-device-token'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 數據分析報表 API。以 SQL 聚合營收與排行資料。
 * 營業日直接取 order_id 前 8 碼比對；時段統計以 UTC+8 換算本地小時。
 * 所有查詢都排除 order_status = '已取消' 的作廢訂單，跟 shifts.ts 的
 * sumCashSales 同一套規則，避免作廢訂單虛增營收與排行數字。
 */

const getSalesReportRoute = createRoute({
  method: 'get',
  path: '/sales',
  middleware: [requireDeviceToken] as const,
  request: { query: salesReportQuerySchema },
  responses: {
    200: {
      description: '指定營業日範圍的營業額與熱銷排行報表',
      content: { 'application/json': { schema: salesReportSchema } }
    },
    400: {
      description: 'from／to 格式錯誤，或 from 晚於 to',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

const HOURLY_REPORT_START_HOUR = 8
const HOURLY_REPORT_END_HOUR = 22
const TOP_RANKING_LIMIT = 5

/** 依 YYYYMMDD 格式的營業日逐日列出 [from, to] 之間（含頭尾）的每一天。 */
function businessDatesInRange(from: string, to: string): string[] {
  const parse = (value: string) =>
    new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))
  const format = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`

  const dates: string[] = []
  const cursor = parse(from)
  const end = parse(to)
  while (cursor <= end) {
    dates.push(format(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export const reportRoutes = new OpenAPIHono<AppEnv>().openapi(getSalesReportRoute, async (c) => {
  const { from, to } = c.req.valid('query')
  const db = c.get('db')
  const tenantId = c.get('tenantId')

  const [
    dailyRows,
    hourlyRows,
    orderCountRow,
    discountRow,
    voidedRow,
    refundRow,
    channelRows,
    topProductRows,
    topAddOnRows,
    topPaymentRows,
    topCategoryRows
  ] = await Promise.all([
    db.all<{ business_date: string; revenue: number }>(sql`
      select substr(order_id, 1, 8) as business_date, sum(order_payment_price) as revenue
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
      group by business_date
    `),
    db.all<{ hour: number; revenue: number }>(sql`
      select cast(strftime('%H', datetime(order_time, '+8 hours')) as integer) as hour,
             sum(order_payment_price) as revenue
      from orders
      where substr(order_id, 1, 8) = ${from}
        and order_status = '已完成' and tenant_id is ${tenantId}
      group by hour
    `),
    // 完成訂單總筆數：獨立算好回傳，避免前端拿被 TOP_RANKING_LIMIT 截斷的
    // topPaymentMethods 加總去湊訂單數（付款方式種類一多就會少算）。
    db.all<{ count: number }>(sql`
      select count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
    `),
    // 折扣總額＝優惠券折抵（orderTotalPrice - orderPaymentPrice），已完成訂單才算，
    // 跟營收用同一個過濾條件，才能對得上「毛額 vs 淨額」。
    db.all<{ amount: number | null }>(sql`
      select sum(order_discount) as amount
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
    `),
    // 作廢訂單筆數：故意不套用 order_status = '已完成' 的過濾，這裡要算的正是被排除在外的那些。
    db.all<{ count: number }>(sql`
      select count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已取消' and tenant_id is ${tenantId}
    `),
    // 退款：訂單仍是「已完成」、只是退了部分或全部的錢，用訂單所屬營業日篩選區間
    // （不是退款發生的時間），跟報表其他欄位的區間定義一致。
    db.all<{ orderCount: number; amount: number | null }>(sql`
      select count(distinct o.order_id) as orderCount, sum(r.amount) as amount
      from order_refunds r
      join orders o on o.order_id = r.order_id
      where substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
        and o.order_status = '已完成' and o.tenant_id is ${tenantId}
    `),
    db.all<{ channel: string; count: number; revenue: number }>(sql`
      select order_channel as channel, count(*) as count, sum(order_payment_price) as revenue
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
      group by order_channel
    `),
    db.all<{ name: string; count: number }>(sql`
      select ol.name as name, sum(ol.count) as count
      from order_lines ol
      join orders o on o.order_id = ol.order_id
      where substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
        and o.order_status = '已完成' and o.tenant_id is ${tenantId}
      group by ol.name
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
    db.all<{ name: string; count: number }>(sql`
      select je.value as name, sum(ol.count) as count
      from order_lines ol
      join orders o on o.order_id = ol.order_id
      join json_each(ol.add_list) je
      where json_type(ol.add_list) = 'array'
        and substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
        and o.order_status = '已完成' and o.tenant_id is ${tenantId}
      group by je.value
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
    // 付款方式排行依 orders.order_payment 摘要分組（混合支付視為獨立分類）。
    db.all<{ name: string; count: number }>(sql`
      select order_payment as name, count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
      group by order_payment
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
    // 分類排行透過品項名稱回查 products/categories：訂單品項只存名稱快照，
    // 跟 deductStock() 用同一種「以名稱比對」的既有限制（改過名字的品項對不到）。
    // 一併過濾 p.tenant_id：不同租戶可能有同名品項，理由同 deductStock()。
    db.all<{ name: string; count: number }>(sql`
      select c.name as name, sum(ol.count) as count
      from order_lines ol
      join orders o on o.order_id = ol.order_id
      join products p on p.name = ol.name and p.tenant_id is ${tenantId}
      join categories c on c.id = p.category_id
      where substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
        and o.order_status = '已完成' and o.tenant_id is ${tenantId}
      group by c.name
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `)
  ])

  const revenueByDate = new Map(dailyRows.map((row) => [row.business_date, row.revenue]))
  const dailyRevenue = businessDatesInRange(from, to).map((businessDate) => ({
    businessDate,
    revenue: revenueByDate.get(businessDate) ?? 0
  }))

  const revenueByHour = new Map(hourlyRows.map((row) => [row.hour, row.revenue]))
  const hourCount = HOURLY_REPORT_END_HOUR - HOURLY_REPORT_START_HOUR + 1
  const hourlyRevenue = Array.from(
    { length: hourCount },
    (_, i) => HOURLY_REPORT_START_HOUR + i
  ).map((hour) => ({
    hour,
    revenue: revenueByHour.get(hour) ?? 0
  }))

  return c.json(
    salesReportSchema.parse({
      dailyRevenue,
      hourlyRevenue,
      orderCount: orderCountRow[0]?.count ?? 0,
      discountAmount: discountRow[0]?.amount ?? 0,
      voidedOrderCount: voidedRow[0]?.count ?? 0,
      refundedOrderCount: refundRow[0]?.orderCount ?? 0,
      refundAmount: refundRow[0]?.amount ?? 0,
      channelBreakdown: channelRows.map((row) => ({
        channel: row.channel,
        count: row.count,
        revenue: row.revenue
      })),
      topProducts: topProductRows.map((row) => ({ name: row.name, count: row.count })),
      topAddOns: topAddOnRows.map((row) => ({ name: row.name, count: row.count })),
      topPaymentMethods: topPaymentRows.map((row) => ({ name: row.name, count: row.count })),
      topCategories: topCategoryRows.map((row) => ({ name: row.name, count: row.count }))
    }),
    200
  )
})
