import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { salesReportQuerySchema, salesReportSchema } from '@pos/contract'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 數據分析報表 API。以 SQL 聚合營收與排行資料。
 * 營業日直接取 order_id 前 8 碼比對；時段統計以 UTC+8 換算本地小時。
 */

const getSalesReportRoute = createRoute({
  method: 'get',
  path: '/sales',
  request: { query: salesReportQuerySchema },
  responses: {
    200: {
      description: '指定營業日範圍的營業額與熱銷排行報表',
      content: { 'application/json': { schema: salesReportSchema } },
    },
    400: { description: 'from／to 格式錯誤，或 from 晚於 to', content: { 'application/json': { schema: errorSchema } } },
  },
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

  const [dailyRows, hourlyRows, topProductRows, topAddOnRows, topPaymentRows, topCategoryRows] = await Promise.all([
    db.all<{ business_date: string; revenue: number }>(sql`
      select substr(order_id, 1, 8) as business_date, sum(order_payment_price) as revenue
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
      group by business_date
    `),
    db.all<{ hour: number; revenue: number }>(sql`
      select cast(strftime('%H', datetime(order_time, '+8 hours')) as integer) as hour,
             sum(order_payment_price) as revenue
      from orders
      where substr(order_id, 1, 8) = ${from}
      group by hour
    `),
    db.all<{ name: string; count: number }>(sql`
      select ol.name as name, sum(ol.count) as count
      from order_lines ol
      join orders o on o.order_id = ol.order_id
      where substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
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
      group by je.value
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
    // 付款方式排行依 orders.order_payment 摘要分組（混合支付視為獨立分類）。
    db.all<{ name: string; count: number }>(sql`
      select order_payment as name, count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
      group by order_payment
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
    // 分類排行透過品項名稱回查 products/categories：訂單品項只存名稱快照，
    // 跟 deductStock() 用同一種「以名稱比對」的既有限制（改過名字的品項對不到）。
    db.all<{ name: string; count: number }>(sql`
      select c.name as name, sum(ol.count) as count
      from order_lines ol
      join orders o on o.order_id = ol.order_id
      join products p on p.name = ol.name
      join categories c on c.id = p.category_id
      where substr(o.order_id, 1, 8) >= ${from} and substr(o.order_id, 1, 8) <= ${to}
      group by c.name
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
  ])

  const revenueByDate = new Map(dailyRows.map((row) => [row.business_date, row.revenue]))
  const dailyRevenue = businessDatesInRange(from, to).map((businessDate) => ({
    businessDate,
    revenue: revenueByDate.get(businessDate) ?? 0,
  }))

  const revenueByHour = new Map(hourlyRows.map((row) => [row.hour, row.revenue]))
  const hourCount = HOURLY_REPORT_END_HOUR - HOURLY_REPORT_START_HOUR + 1
  const hourlyRevenue = Array.from({ length: hourCount }, (_, i) => HOURLY_REPORT_START_HOUR + i).map((hour) => ({
    hour,
    revenue: revenueByHour.get(hour) ?? 0,
  }))

  return c.json(
    salesReportSchema.parse({
      dailyRevenue,
      hourlyRevenue,
      topProducts: topProductRows.map((row) => ({ name: row.name, count: row.count })),
      topAddOns: topAddOnRows.map((row) => ({ name: row.name, count: row.count })),
      topPaymentMethods: topPaymentRows.map((row) => ({ name: row.name, count: row.count })),
      topCategories: topCategoryRows.map((row) => ({ name: row.name, count: row.count })),
    }),
    200,
  )
})
