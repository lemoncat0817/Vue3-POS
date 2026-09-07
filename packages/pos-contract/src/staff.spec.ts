import { describe, expect, it } from 'vitest'
import { createStaffRequestSchema, operatorLoginRequestSchema, pinSchema } from './staff'

describe('pinSchema', () => {
  it('接受 4 到 6 碼數字', () => {
    expect(pinSchema.safeParse('1234').success).toBe(true)
    expect(pinSchema.safeParse('123456').success).toBe(true)
  })

  it('拒絕太短、太長、或含非數字字元', () => {
    expect(pinSchema.safeParse('123').success).toBe(false)
    expect(pinSchema.safeParse('1234567').success).toBe(false)
    expect(pinSchema.safeParse('12a4').success).toBe(false)
  })
})

describe('createStaffRequestSchema', () => {
  const validInput = {
    name: 'Emily',
    jobTitle: '工讀生',
    account: 'emily',
    capabilities: ['canCheckOrder'],
    pin: '3456',
  }

  it('接受帶 PIN 的完整輸入', () => {
    expect(createStaffRequestSchema.safeParse(validInput).success).toBe(true)
  })

  it('沒有 pin 欄位時拒絕（新增員工當下必須設定 PIN）', () => {
    const withoutPin: Partial<typeof validInput> = { ...validInput }
    delete withoutPin.pin
    expect(createStaffRequestSchema.safeParse(withoutPin).success).toBe(false)
  })
})

describe('operatorLoginRequestSchema', () => {
  it('接受 account／pin', () => {
    expect(operatorLoginRequestSchema.safeParse({ account: 'emily', pin: '3456' }).success).toBe(true)
  })

  it('pin 格式不對也算合法輸入（格式驗證不應該洩漏帳號是否存在，錯誤要在業務邏輯層統一擋下）', () => {
    expect(operatorLoginRequestSchema.safeParse({ account: 'emily', pin: 'wrong' }).success).toBe(true)
  })
})
