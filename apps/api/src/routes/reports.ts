import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { salesReportQuerySchema, salesReportSchema } from '@pos/contract'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 數據分析報表（P7：規劃書 §02 缺陷目錄 D-15）。
 *
 * 原本 apps/pos 的 dataAnalysis 頁面直接對本機 stores/order.ts 裡的
 * 訂單陣列（見 @pos/contract 的 reports.ts 說明）逐筆 filter，這裡改成
 * 直接對 orders／order_lines 做 SQL 聚合。查詢刻意不用裝置憑證保護
 * （requireDeviceToken）——這是唯讀的統計端點，跟 GET /api/catalog、
 * GET /api/promotions 一樣走「讀取公開、寫入才需要裝置憑證」的既有
 * 慣例（見 middleware/require-device-token.ts 的說明），不是這裡才
 * 引入的新原則。
 *
 * 營業日（YYYYMMDD）從 order_id 的前 8 碼取得，不是重新從 order_time
 * 推算——order_id 的前綴本來就是用戶端當下用 @pos/domain 的
 * getBusinessDate() 算好、伺服端核發訂單編號時直接採用的營業日（見
 * nextOrderSequence()，orders.ts），字典序比較對固定寬度、零補齊的
 * YYYYMMDD 字串成立，不需要額外剖析。
 *
 * 但「這張訂單發生在當天的第幾個小時」沒辦法從 order_id 取得，只能從
 * order_time（伺服端用 `new Date().toISOString()` 存的 UTC 時間戳，見
 * orders.ts）反推——這個專案目前只服務單一時區（台北，UTC+8，見
 * @pos/domain 的 business-date.ts 已經隱含這個假設），這裡用固定
 * +8 小時位移換算成本地時間再取小時數，不是通用時區處理，之後如果要
 * 支援多時區部署需要重新設計。
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

  const [dailyRows, hourlyRows, topDrinkRows, topAddOnRows, topPaymentRows] = await Promise.all([
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
    // 已知簡化（P6：混合支付）：這裡分組用的是 orders.order_payment，
    // 一筆訂單的多筆 tender 顯示用摘要（例如「現金、信用卡」），混合
    // 支付的訂單會落在自己獨立的一個分類，不會拆成「現金」「信用卡」
    // 兩筆各自累計次數。要拆開需要改成 join order_tenders 表按 method
    // 分組，且「一筆訂單算幾次」在混合支付下的定義本身也要重新界定
    // （依訂單算一次，還是依 tender 筆數算）——這屬於報表口徑的產品
    // 決策，不是單純的技術修改，這裡先保留舊行為。
    db.all<{ name: string; count: number }>(sql`
      select order_payment as name, count(*) as count
      from orders
      where substr(order_id, 1, 8) >= ${from} and substr(order_id, 1, 8) <= ${to}
      group by order_payment
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
      topDrinks: topDrinkRows.map((row) => ({ name: row.name, count: row.count })),
      topAddOns: topAddOnRows.map((row) => ({ name: row.name, count: row.count })),
      topPaymentMethods: topPaymentRows.map((row) => ({ name: row.name, count: row.count })),
    }),
    200,
  )
})
