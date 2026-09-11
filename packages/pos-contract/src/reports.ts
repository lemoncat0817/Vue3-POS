import { z } from 'zod'
import { businessDateSchema } from './common'
import { orderChannelSchema } from './order'

/** 數據分析報表 schema。由伺服端聚合訂單資料，避免客戶端反覆掃描且支援多終端匯總。 */

export const salesReportQuerySchema = z
  .object({
    from: businessDateSchema,
    to: businessDateSchema
  })
  .refine((value) => value.from <= value.to, {
    message: 'from 不能晚於 to',
    path: ['from']
  })
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>

/** 單一天內、每個營業時段（8～22 時，對應現行畫面固定的營業時間）的營業額。 */
export const hourlyRevenuePointSchema = z.object({
  hour: z.number().int().min(0).max(23),
  revenue: z.number().int()
})
export type HourlyRevenuePoint = z.infer<typeof hourlyRevenuePointSchema>

/** 查詢範圍內、每一個營業日的營業額。沒有訂單的日子也會出現，revenue 是 0。 */
export const dailyRevenuePointSchema = z.object({
  businessDate: businessDateSchema,
  revenue: z.number().int()
})
export type DailyRevenuePoint = z.infer<typeof dailyRevenuePointSchema>

/** 熱門排行的一列，用於熱銷品項／加購選項／付款方式／分類四張圖表共用的形狀。 */
export const rankedCountSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative()
})
export type RankedCount = z.infer<typeof rankedCountSchema>

/** 內用／外帶各自的訂單數與營業額。 */
export const channelBreakdownSchema = z.object({
  channel: orderChannelSchema,
  count: z.number().int().nonnegative(),
  revenue: z.number().int().nonnegative()
})
export type ChannelBreakdown = z.infer<typeof channelBreakdownSchema>

/** GET /api/reports/sales 回應。同時包含日與時段資料，由前端依查詢範圍決定圖表呈現。 */
export const salesReportSchema = z.object({
  hourlyRevenue: z.array(hourlyRevenuePointSchema),
  dailyRevenue: z.array(dailyRevenuePointSchema),
  // 完成訂單總筆數，不受 topPaymentMethods 只列前五名的截斷影響。
  orderCount: z.number().int().nonnegative(),
  topProducts: z.array(rankedCountSchema),
  topAddOns: z.array(rankedCountSchema),
  topPaymentMethods: z.array(rankedCountSchema),
  topCategories: z.array(rankedCountSchema),
  // 折扣總額＝已完成訂單的 orderTotalPrice 減 orderPaymentPrice 加總（優惠券折抵），
  // 不含退款——退款是訂單成立後才發生的money out，跟下單當下的折扣是兩件事。
  discountAmount: z.number().int().nonnegative(),
  // 作廢訂單筆數與退款相關指標，用於監控異常率（過高可能代表操作誤用或訓練不足）。
  voidedOrderCount: z.number().int().nonnegative(),
  refundedOrderCount: z.number().int().nonnegative(),
  refundAmount: z.number().int().nonnegative(),
  channelBreakdown: z.array(channelBreakdownSchema)
})
export type SalesReport = z.infer<typeof salesReportSchema>
