import { describe, expect, it } from 'vitest'
import {
  createTableRequestSchema,
  diningTableSchema,
  reservationPhoneSchema,
  tableStatusSchema,
  updateTableRequestSchema,
  updateTableStatusRequestSchema
} from './table'

describe('table status & phone schemas', () => {
  it('tableStatusSchema 接受 empty, occupied, reserved', () => {
    expect(tableStatusSchema.safeParse('empty').success).toBe(true)
    expect(tableStatusSchema.safeParse('occupied').success).toBe(true)
    expect(tableStatusSchema.safeParse('reserved').success).toBe(true)
    expect(tableStatusSchema.safeParse('cleaning').success).toBe(false)
  })

  it('reservationPhoneSchema 嚴格要求 09 開頭之 10 碼台灣手機號碼', () => {
    expect(reservationPhoneSchema.safeParse('0912345678').success).toBe(true)
    expect(reservationPhoneSchema.safeParse('0212345678').success).toBe(false)
    expect(reservationPhoneSchema.safeParse('091234567').success).toBe(false)
    expect(reservationPhoneSchema.safeParse('09123456789').success).toBe(false)
  })
})

describe('diningTableSchema', () => {
  it('驗證完整桌位資料結構', () => {
    const validTable = {
      id: 'table-1',
      tableNumber: 'A1',
      seats: 4,
      status: 'occupied' as const,
      note: '靠窗',
      guestCount: 3,
      occupiedAt: '2025-05-01T12:30:00Z',
      reservationPhone: null,
      reservationTime: null
    }
    expect(diningTableSchema.safeParse(validTable).success).toBe(true)
  })

  it('拒絕座位數小於等於 0 的桌位', () => {
    const invalidTable = {
      id: 'table-1',
      tableNumber: 'A1',
      seats: 0,
      status: 'empty' as const,
      note: '',
      guestCount: null,
      occupiedAt: null,
      reservationPhone: null,
      reservationTime: null
    }
    expect(diningTableSchema.safeParse(invalidTable).success).toBe(false)
  })
})

describe('table mutation schemas', () => {
  it('createTableRequestSchema 驗證桌號與座位數', () => {
    expect(createTableRequestSchema.safeParse({ tableNumber: 'B2', seats: 2 }).success).toBe(true)
    expect(updateTableRequestSchema.safeParse({ tableNumber: 'B2', seats: 2 }).success).toBe(true)
    expect(createTableRequestSchema.safeParse({ tableNumber: '', seats: 2 }).success).toBe(false)
    expect(createTableRequestSchema.safeParse({ tableNumber: 'B2', seats: -1 }).success).toBe(false)
  })

  it('updateTableStatusRequestSchema 允許狀態切換與附帶欄位', () => {
    expect(
      updateTableStatusRequestSchema.safeParse({
        status: 'reserved',
        reservationPhone: '0912345678',
        reservationTime: '2025-05-01T18:00:00Z'
      }).success
    ).toBe(true)

    expect(
      updateTableStatusRequestSchema.safeParse({
        status: 'reserved',
        reservationPhone: 'not-a-phone'
      }).success
    ).toBe(false)
  })
})
