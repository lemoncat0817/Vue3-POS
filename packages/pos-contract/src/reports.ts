import { z } from 'zod'
import { businessDateSchema } from './common'
import { orderChannelSchema } from './order'

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

export const hourlyRevenuePointSchema = z.object({
  hour: z.number().int().min(0).max(23),
  revenue: z.number().int()
})
export type HourlyRevenuePoint = z.infer<typeof hourlyRevenuePointSchema>

export const dailyRevenuePointSchema = z.object({
  businessDate: businessDateSchema,
  revenue: z.number().int()
})
export type DailyRevenuePoint = z.infer<typeof dailyRevenuePointSchema>

export const rankedCountSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative()
})
export type RankedCount = z.infer<typeof rankedCountSchema>

export const channelBreakdownSchema = z.object({
  channel: orderChannelSchema,
  count: z.number().int().nonnegative(),
  revenue: z.number().int().nonnegative()
})
export type ChannelBreakdown = z.infer<typeof channelBreakdownSchema>

export const salesReportSchema = z.object({
  hourlyRevenue: z.array(hourlyRevenuePointSchema),
  dailyRevenue: z.array(dailyRevenuePointSchema),
  orderCount: z.number().int().nonnegative(),
  topProducts: z.array(rankedCountSchema),
  topAddOns: z.array(rankedCountSchema),
  topPaymentMethods: z.array(rankedCountSchema),
  topCategories: z.array(rankedCountSchema),
  discountAmount: z.number().int().nonnegative(),
  voidedOrderCount: z.number().int().nonnegative(),
  refundedOrderCount: z.number().int().nonnegative(),
  refundAmount: z.number().int().nonnegative(),
  channelBreakdown: z.array(channelBreakdownSchema)
})
export type SalesReport = z.infer<typeof salesReportSchema>
