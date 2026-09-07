import { describe, expect, it } from 'vitest'
import { formatBusinessDate, toBusinessDate } from './time'

describe('toBusinessDate', () => {
  it('把 el-date-picker 的 YYYY/MM/DD 轉成 API 用的 YYYYMMDD', () => {
    expect(toBusinessDate('2026/09/07')).toBe('20260907')
  })
})

describe('formatBusinessDate', () => {
  it('把 API 用的 YYYYMMDD 轉回畫面顯示用的 YYYY/MM/DD', () => {
    expect(formatBusinessDate('20260907')).toBe('2026/09/07')
  })

  it('跟 toBusinessDate 互為反函式', () => {
    expect(formatBusinessDate(toBusinessDate('2026/01/01'))).toBe('2026/01/01')
  })
})
