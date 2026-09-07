import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { addMinor, allocate, fromMinor, roundToDollar, scaleMinor, subtractMinor, toMinor } from './money'

describe('toMinor / fromMinor', () => {
  it('元轉分再轉回元，等於原本的元（四捨五入到分）', () => {
    expect(toMinor(90)).toBe(9000)
    expect(fromMinor(toMinor(90))).toBe(90)
    expect(toMinor(12.345)).toBe(1235) // 12.345 元 = 1234.5 分，四捨五入為 1235
  })
})

describe('roundToDollar', () => {
  it('四捨五入到最接近的元', () => {
    expect(fromMinor(roundToDollar(toMinor(90.4)))).toBe(90)
    expect(fromMinor(roundToDollar(toMinor(90.5)))).toBe(91)
    expect(fromMinor(roundToDollar(toMinor(90.6)))).toBe(91)
  })

  it('已經是整元時保持不變', () => {
    expect(fromMinor(roundToDollar(toMinor(100)))).toBe(100)
  })
})

describe('scaleMinor / addMinor / subtractMinor', () => {
  it('乘以折數並四捨五入到分', () => {
    // 100 元 * 0.9 = 90 元，精確無需取整
    expect(fromMinor(scaleMinor(toMinor(100), 0.9))).toBe(90)
  })

  it('加減法在分的精度下運算', () => {
    const a = toMinor(50)
    const b = toMinor(30)
    expect(fromMinor(addMinor(a, b))).toBe(80)
    expect(fromMinor(subtractMinor(a, b))).toBe(20)
  })
})

describe('allocate（最大餘數法分攤）', () => {
  it('依權重比例分攤，總和等於原始金額', () => {
    const total = toMinor(100) // 10000 分
    const shares = allocate(total, [1, 1, 1])
    expect(shares.reduce((sum, s) => sum + s, 0)).toBe(total)
    // 10000 分分成三份，每份約 3333.33 分，兩份拿 3333、一份拿 3334
    expect([...shares].sort((a, b) => a - b)).toEqual([3333, 3333, 3334])
  })

  it('單一項目時全額分給該項目', () => {
    const total = toMinor(77)
    expect(allocate(total, [1])).toEqual([total])
  })

  it('權重全為 0 時不除以零，全額分給第一項', () => {
    const total = toMinor(50)
    const shares = allocate(total, [0, 0])
    expect(shares.reduce((sum, s) => sum + s, 0)).toBe(total)
  })

  it('空權重陣列回傳空陣列', () => {
    expect(allocate(toMinor(50), [])).toEqual([])
  })

  it('性質測試：任意權重與總額，分攤結果總和恆等於總額', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000, max: 1_000_000 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 20 }),
        (totalDollars, weights) => {
          const total = toMinor(totalDollars)
          const shares = allocate(total, weights)
          const sum = shares.reduce((acc, s) => acc + s, 0)
          expect(sum).toBe(total)
          expect(shares).toHaveLength(weights.length)
        },
      ),
    )
  })
})
