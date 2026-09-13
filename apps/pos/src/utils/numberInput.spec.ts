import { describe, expect, it } from 'vitest'
import { digitsOnly, parseOptionalInt, parseRequiredInt } from './numberInput'

describe('digitsOnly', () => {
  it('過濾掉字母、符號、小數點，只留下數字', () => {
    expect(digitsOnly('abc123')).toBe('123')
    expect(digitsOnly('0912-345678')).toBe('0912345678')
    expect(digitsOnly('12.5')).toBe('125')
    expect(digitsOnly('')).toBe('')
  })
})

describe('parseOptionalInt', () => {
  it('空字串回傳 null，代表使用者清空了這個欄位', () => {
    expect(parseOptionalInt('')).toBeNull()
  })
  it('過濾掉非數字字元後轉成整數', () => {
    expect(parseOptionalInt('abc')).toBeNull()
    expect(parseOptionalInt('5')).toBe(5)
    expect(parseOptionalInt('05')).toBe(5)
  })
})

describe('parseRequiredInt', () => {
  it('空字串或全部刪掉都當作 0，不會是 NaN', () => {
    expect(parseRequiredInt('')).toBe(0)
    expect(parseRequiredInt('abc')).toBe(0)
  })
  it('有 max 時超過會被夾住', () => {
    expect(parseRequiredInt('999', { max: 100 })).toBe(100)
    expect(parseRequiredInt('50', { max: 100 })).toBe(50)
  })
})
