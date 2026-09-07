import { describe, expect, it } from 'vitest'
import { addCashMovementRequestSchema, closeShiftRequestSchema, openShiftRequestSchema } from './shift'

describe('openShiftRequestSchema', () => {
  it('接受合法的開帳請求', () => {
    const result = openShiftRequestSchema.safeParse({
      shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      operator: '店長 - Lemon',
      openingFloat: 3000,
    })
    expect(result.success).toBe(true)
  })

  it('拒絕不合法的 shiftId（不是 ULID）', () => {
    const result = openShiftRequestSchema.safeParse({
      shiftId: 'not-a-ulid',
      operator: '店長 - Lemon',
      openingFloat: 3000,
    })
    expect(result.success).toBe(false)
  })

  it('拒絕負數的開帳零用金', () => {
    const result = openShiftRequestSchema.safeParse({
      shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      operator: '店長 - Lemon',
      openingFloat: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('addCashMovementRequestSchema', () => {
  it('接受 in／out 兩種類型', () => {
    expect(
      addCashMovementRequestSchema.safeParse({ type: 'in', amount: 1000, reason: '找零準備金追加', operator: '店長 - Lemon' })
        .success,
    ).toBe(true)
    expect(
      addCashMovementRequestSchema.safeParse({ type: 'out', amount: 500, reason: '存入保險箱', operator: '店長 - Lemon' })
        .success,
    ).toBe(true)
  })

  it('拒絕非正數的金額', () => {
    const result = addCashMovementRequestSchema.safeParse({ type: 'in', amount: 0, reason: '測試', operator: '店長 - Lemon' })
    expect(result.success).toBe(false)
  })

  it('拒絕空的原因', () => {
    const result = addCashMovementRequestSchema.safeParse({ type: 'in', amount: 100, reason: '', operator: '店長 - Lemon' })
    expect(result.success).toBe(false)
  })
})

describe('closeShiftRequestSchema', () => {
  it('接受合法的收班請求', () => {
    const result = closeShiftRequestSchema.safeParse({ operator: '店長 - Lemon', actualCash: 8000 })
    expect(result.success).toBe(true)
  })

  it('拒絕負數的實際點鈔金額', () => {
    const result = closeShiftRequestSchema.safeParse({ operator: '店長 - Lemon', actualCash: -1 })
    expect(result.success).toBe(false)
  })
})
