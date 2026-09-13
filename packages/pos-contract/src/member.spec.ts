import { describe, expect, it } from 'vitest'
import {
  createMemberRequestSchema,
  manualPointAdjustmentRequestSchema,
  memberPhoneSchema
} from './member'

describe('memberPhoneSchema', () => {
  it('接受 09 開頭共 10 碼數字', () => {
    expect(memberPhoneSchema.safeParse('0912345678').success).toBe(true)
  })

  it('拒絕太短、太長、非 09 開頭、或含非數字字元', () => {
    expect(memberPhoneSchema.safeParse('091234567').success).toBe(false)
    expect(memberPhoneSchema.safeParse('09123456789').success).toBe(false)
    expect(memberPhoneSchema.safeParse('0812345678').success).toBe(false)
    expect(memberPhoneSchema.safeParse('091234567a').success).toBe(false)
  })

  it('前後空白會先修剪再驗證格式', () => {
    expect(memberPhoneSchema.safeParse('  0912345678  ').success).toBe(true)
  })
})

describe('createMemberRequestSchema', () => {
  it('接受姓名＋合法手機號碼', () => {
    expect(createMemberRequestSchema.safeParse({ name: '王小明', phone: '0912345678' }).success).toBe(
      true
    )
  })

  it('拒絕空姓名或不合法的手機號碼', () => {
    expect(createMemberRequestSchema.safeParse({ name: '', phone: '0912345678' }).success).toBe(
      false
    )
    expect(createMemberRequestSchema.safeParse({ name: '王小明', phone: '手機請洽櫃檯' }).success).toBe(
      false
    )
  })
})

describe('manualPointAdjustmentRequestSchema', () => {
  const validInput = { delta: 50, reason: '生日活動加點', operator: '店長 - Lemon' }

  it('接受非 0 的整數調整量', () => {
    expect(manualPointAdjustmentRequestSchema.safeParse(validInput).success).toBe(true)
    expect(
      manualPointAdjustmentRequestSchema.safeParse({ ...validInput, delta: -20 }).success
    ).toBe(true)
  })

  it('拒絕調整量是 0（沒有意義的調整）', () => {
    expect(
      manualPointAdjustmentRequestSchema.safeParse({ ...validInput, delta: 0 }).success
    ).toBe(false)
  })

  it('拒絕沒有說明原因', () => {
    expect(
      manualPointAdjustmentRequestSchema.safeParse({ ...validInput, reason: '  ' }).success
    ).toBe(false)
  })
})
