import { describe, expect, it } from 'vitest'
import { salesReportQuerySchema, salesReportSchema } from './reports'

describe('salesReportQuerySchema', () => {
  it('from／to 都必須是 YYYYMMDD 格式', () => {
    expect(salesReportQuerySchema.safeParse({ from: '20260101', to: '20260107' }).success).toBe(true)
    expect(salesReportQuerySchema.safeParse({ from: '2026-01-01', to: '20260107' }).success).toBe(false)
  })

  it('from 不能晚於 to', () => {
    expect(salesReportQuerySchema.safeParse({ from: '20260107', to: '20260101' }).success).toBe(false)
    expect(salesReportQuerySchema.safeParse({ from: '20260101', to: '20260101' }).success).toBe(true)
  })
})

describe('salesReportSchema', () => {
  it('接受完整報表回應', () => {
    const result = salesReportSchema.safeParse({
      hourlyRevenue: [{ hour: 8, revenue: 0 }, { hour: 9, revenue: 1200 }],
      dailyRevenue: [{ businessDate: '20260101', revenue: 3400 }],
      orderCount: 9,
      discountAmount: 100,
      voidedOrderCount: 1,
      refundedOrderCount: 0,
      refundAmount: 0,
      channelBreakdown: [{ channel: '內用', count: 5, revenue: 2000 }, { channel: '外帶', count: 4, revenue: 1400 }],
      topProducts: [{ name: '珍珠奶茶', count: 12 }],
      topAddOns: [{ name: '珍珠', count: 12 }],
      topPaymentMethods: [{ name: '現金', count: 9 }],
      topCategories: [{ name: '飲品', count: 12 }],
    })
    expect(result.success).toBe(true)
  })

  it('count／revenue 是負數時視為不合法', () => {
    expect(
      salesReportSchema.safeParse({
        hourlyRevenue: [],
        dailyRevenue: [],
        topProducts: [{ name: '珍珠奶茶', count: -1 }],
        topAddOns: [],
        topPaymentMethods: [],
        topCategories: [],
      }).success,
    ).toBe(false)
  })
})
