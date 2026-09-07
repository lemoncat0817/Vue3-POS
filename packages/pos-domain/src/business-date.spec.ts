import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_DAY_START_HOUR, getBusinessDate } from './business-date'

describe('getBusinessDate（修復 D-03）', () => {
  it('營業日切換時間之後，屬於當天', () => {
    expect(getBusinessDate(new Date(2024, 5, 10, 4, 0, 0))).toBe('20240610')
    expect(getBusinessDate(new Date(2024, 5, 10, 12, 0, 0))).toBe('20240610')
    expect(getBusinessDate(new Date(2024, 5, 10, 23, 59, 59))).toBe('20240610')
  })

  it('凌晨（切換時間之前）歸屬前一個營業日', () => {
    expect(getBusinessDate(new Date(2024, 5, 10, 0, 0, 0))).toBe('20240609')
    expect(getBusinessDate(new Date(2024, 5, 10, 3, 59, 59))).toBe('20240609')
  })

  it('跨月／跨年邊界正確處理', () => {
    expect(getBusinessDate(new Date(2024, 0, 1, 2, 0, 0))).toBe('20231231')
    expect(getBusinessDate(new Date(2024, 2, 1, 1, 0, 0))).toBe('20240229') // 2024 是閏年
  })

  it('可自訂營業日切換時間', () => {
    expect(getBusinessDate(new Date(2024, 5, 10, 5, 0, 0), 6)).toBe('20240609')
    expect(getBusinessDate(new Date(2024, 5, 10, 6, 0, 0), 6)).toBe('20240610')
  })

  it('不依賴 UTC：同一個本地時間點不因時區判斷改變（不使用 toISOString）', () => {
    // D-03 的根因就是原本用 toISOString()（UTC）取日期。這裡直接檢查
    // 回傳值只由 Date 物件的本地 getFullYear/getMonth/getDate/getHours
    // 決定，構造函式與 UTC 偏移無關。
    const local = new Date(2024, 5, 10, 1, 0, 0)
    expect(getBusinessDate(local)).toBe('20240609')
    expect(local.toISOString().includes('2024-06-10') || local.toISOString().includes('2024-06-09')).toBe(true)
    // 不論當地時區把這個時間點換算成哪個 UTC 日期，getBusinessDate 的
    // 結果都應該只反映本地時間的營業日判定，即 20240609。
  })

  it('性質測試：切換時間前後一分鐘，恰好跨越到不同營業日', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const beforeBoundary = new Date(year, month, day, DEFAULT_BUSINESS_DAY_START_HOUR, -1)
          const atBoundary = new Date(year, month, day, DEFAULT_BUSINESS_DAY_START_HOUR, 0)
          expect(getBusinessDate(beforeBoundary)).not.toBe(getBusinessDate(atBoundary))
        },
      ),
    )
  })
})
