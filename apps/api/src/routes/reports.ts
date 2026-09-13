import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { salesReportQuerySchema, salesReportSchema } from '@pos/contract'
import { DEFAULT_BUSINESS_DAY_START_HOUR } from '@pos/domain'
import { users } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

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

const TOP_RANKING_LIMIT = 5

function businessHourSequence(startHour: number): number[] {
  return Array.from({ length: 24 }, (_, i) => (startHour + i) % 24)
}

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

  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  const businessDayStartHour = tenant?.businessDayStartHour ?? DEFAULT_BUSINESS_DAY_START_HOUR

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
    db.all<{ count: number }>(sql`
      select count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
    `),
    db.all<{ amount: number | null }>(sql`
      select sum(order_discount) as amount
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
    `),
    db.all<{ count: number }>(sql`
      select count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已取消' and tenant_id is ${tenantId}
    `),
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
    db.all<{ name: string; count: number }>(sql`
      select order_payment as name, count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
        and order_status = '已完成' and tenant_id is ${tenantId}
      group by order_payment
      order by count desc
      limit ${TOP_RANKING_LIMIT}
    `),
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
  const hourlyRevenue = businessHourSequence(businessDayStartHour).map((hour) => ({
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
