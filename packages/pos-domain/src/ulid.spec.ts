import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { ulid } from './ulid'

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/

describe('ulid', () => {
  it('產生符合 @pos/contract ulidSchema 格式的字串（26 碼 Crockford Base32）', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Date.now() * 2 }), (time) => {
        expect(ulid(time)).toMatch(ULID_PATTERN)
      }),
    )
  })

  it('連續呼叫不會產生重複的值', () => {
    const values = new Set(Array.from({ length: 1000 }, () => ulid()))
    expect(values.size).toBe(1000)
  })

  it('時間戳部分（前 10 碼）依字典序反映時間先後', () => {
    const earlier = ulid(1_700_000_000_000)
    const later = ulid(1_700_000_000_001)
    expect(earlier.slice(0, 10) <= later.slice(0, 10)).toBe(true)
  })
})
