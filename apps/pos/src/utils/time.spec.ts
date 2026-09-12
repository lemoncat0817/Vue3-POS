import { describe, expect, it } from 'vitest'
import { formatBusinessDate, formatDateOnly, formatDateTime, toBusinessDate } from './time'

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

describe('formatDateTime', () => {
  const pad = (num: number) => (num < 10 ? `0${num}` : String(num))

  it('把伺服端的 ISO UTC 字串換算成本地時區的易讀格式', () => {
    const iso = '2026-09-12T17:38:12.805Z'
    const local = new Date(iso)
    const expected = `${local.getFullYear()}/${pad(local.getMonth() + 1)}/${pad(local.getDate())} ${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`
    expect(formatDateTime(iso)).toBe(expected)
  })

  it('本機尚未同步、已經是 YYYY/MM/DD HH:mm:ss 格式的訂單時間直接原樣回傳', () => {
    expect(formatDateTime('2026/09/12 17:38:12')).toBe('2026/09/12 17:38:12')
  })

  it('無法解析的字串直接原樣回傳，不拋錯', () => {
    expect(formatDateTime('not-a-date-T')).toBe('not-a-date-T')
  })
})

describe('formatDateOnly', () => {
  it('把 ISO 字串換算成本地時區的日期，而不是直接 slice UTC 日期', () => {
    const iso = '2026-09-12T17:38:12.805Z'
    const local = new Date(iso)
    const pad = (num: number) => (num < 10 ? `0${num}` : String(num))
    const expected = `${local.getFullYear()}/${pad(local.getMonth() + 1)}/${pad(local.getDate())}`
    expect(formatDateOnly(iso)).toBe(expected)
  })

  it('無法解析的字串退回原本 slice(0, 10) 的行為', () => {
    expect(formatDateOnly('invalid')).toBe('invalid')
  })
})
