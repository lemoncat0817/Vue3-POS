import { describe, expect, it } from 'vitest'
import {
  tableStatusCardClass,
  tableStatusLabel,
  tableStatusOptions
} from './tableStatus'

describe('tableStatus utils', () => {
  it('tableStatusLabel 回傳正確中文標籤', () => {
    expect(tableStatusLabel('empty')).toBe('空桌')
    expect(tableStatusLabel('occupied')).toBe('使用中')
    expect(tableStatusLabel('reserved')).toBe('已預約')
  })

  it('tableStatusOptions 包含三種狀態定義', () => {
    expect(tableStatusOptions.map((o) => o.value)).toEqual(['empty', 'occupied', 'reserved'])
  })

  it('tableStatusCardClass 回傳對應狀態的樣式 class', () => {
    expect(tableStatusCardClass('occupied')).toContain('border-danger-300')
    expect(tableStatusCardClass('reserved')).toContain('border-warning-300')
    expect(tableStatusCardClass('empty')).toContain('border-success-300')
  })
})
