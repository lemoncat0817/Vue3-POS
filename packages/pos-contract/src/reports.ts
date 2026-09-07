import { z } from 'zod'
import { businessDateSchema } from './common'

/**
 * 數據分析報表相關的 schema（P7：規劃書 §02 缺陷目錄 D-15）。
 *
 * 原本 apps/pos 的 dataAnalysis 頁面完全沒有打過任何 API——直接對
 * stores/order.ts 裡「這台裝置自己送過的訂單」（本機種子資料 +
 * 本機曾經送出的訂單，見該 store 的說明）逐筆 `.filter()` 統計，圖表
 * 每切換一次都要重新掃過整份陣列好幾遍。這不只是效能問題：單店多機
 * 情境下，這份報表本來就看不到「其他終端機送出的訂單」，統計出來的
 * 數字不完整。改成伺服端直接對 D1 的 orders／order_lines 做 SQL
 * 聚合（見 apps/api/src/routes/reports.ts），一次回應涵蓋整份報表頁
 * 需要的所有資料，同時也修好了資料來源不完整的問題。
 */

export const salesReportQuerySchema = z
  .object({
    from: businessDateSchema,
    to: businessDateSchema,
  })
  .refine((value) => value.from <= value.to, {
    message: 'from 不能晚於 to',
    path: ['from'],
  })
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>

/** 單一天內、每個營業時段（8～22 時，對應現行畫面固定的營業時間）的營業額。 */
export const hourlyRevenuePointSchema = z.object({
  hour: z.number().int().min(0).max(23),
  revenue: z.number().int(),
})
export type HourlyRevenuePoint = z.infer<typeof hourlyRevenuePointSchema>

/** 查詢範圍內、每一個營業日的營業額。沒有訂單的日子也會出現，revenue 是 0。 */
export const dailyRevenuePointSchema = z.object({
  businessDate: businessDateSchema,
  revenue: z.number().int(),
})
export type DailyRevenuePoint = z.infer<typeof dailyRevenuePointSchema>

/** 熱門排行的一列，用於熱門飲料／配料／付款方式三張圖表共用的形狀。 */
export const rankedCountSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
})
export type RankedCount = z.infer<typeof rankedCountSchema>

/**
 * GET /api/reports/sales 的完整回應。dailyRevenue／hourlyRevenue 兩者
 * 都會回傳——由前端依「查詢範圍是不是同一天」決定要畫哪一張圖（沿用
 * 原本頁面的判斷方式），伺服端不需要知道使用者選的是哪種檢視模式。
 */
export const salesReportSchema = z.object({
  hourlyRevenue: z.array(hourlyRevenuePointSchema),
  dailyRevenue: z.array(dailyRevenuePointSchema),
  topDrinks: z.array(rankedCountSchema),
  topAddOns: z.array(rankedCountSchema),
  topPaymentMethods: z.array(rankedCountSchema),
})
export type SalesReport = z.infer<typeof salesReportSchema>
