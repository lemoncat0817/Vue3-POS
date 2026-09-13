import { describe, expect, it } from 'vitest'
import {
  createInvoiceTrackRequestSchema,
  invoiceStatusSchema,
  invoiceTrackSchema,
  submitInvoicesResponseSchema
} from './invoice'

describe('invoiceTrackSchema & createInvoiceTrackRequestSchema', () => {
  const validTrack = {
    id: 'track-1',
    trackCode: 'AB',
    periodLabel: '113年05-06月',
    rangeStart: 10000000,
    rangeEnd: 10000099,
    currentNumber: 10000000,
    isActive: true
  }

  it('invoiceTrackSchema 接受合法字軌設定', () => {
    expect(invoiceTrackSchema.safeParse(validTrack).success).toBe(true)
  })

  it('拒絕不合法的字軌格式（必須為 2 碼大寫英文）', () => {
    expect(invoiceTrackSchema.safeParse({ ...validTrack, trackCode: 'ab' }).success).toBe(false)
    expect(invoiceTrackSchema.safeParse({ ...validTrack, trackCode: 'ABC' }).success).toBe(false)
    expect(invoiceTrackSchema.safeParse({ ...validTrack, trackCode: '12' }).success).toBe(false)
  })

  it('createInvoiceTrackRequestSchema 拒絕結束號碼小於或等於起始號碼', () => {
    const validReq = {
      trackCode: 'XY',
      periodLabel: '113年07-08月',
      rangeStart: 100,
      rangeEnd: 200
    }
    expect(createInvoiceTrackRequestSchema.safeParse(validReq).success).toBe(true)

    expect(
      createInvoiceTrackRequestSchema.safeParse({
        ...validReq,
        rangeEnd: 100
      }).success
    ).toBe(false)

    expect(
      createInvoiceTrackRequestSchema.safeParse({
        ...validReq,
        rangeEnd: 99
      }).success
    ).toBe(false)
  })
})

describe('invoiceStatusSchema & submitInvoicesResponseSchema', () => {
  it('invoiceStatusSchema 僅接受 issued, submitted, voided', () => {
    expect(invoiceStatusSchema.safeParse('issued').success).toBe(true)
    expect(invoiceStatusSchema.safeParse('submitted').success).toBe(true)
    expect(invoiceStatusSchema.safeParse('voided').success).toBe(true)
    expect(invoiceStatusSchema.safeParse('cancelled').success).toBe(false)
  })

  it('submitInvoicesResponseSchema 驗證上傳回應', () => {
    expect(
      submitInvoicesResponseSchema.safeParse({
        submittedCount: 15,
        submittedAt: '2025-05-01T12:00:00Z'
      }).success
    ).toBe(true)
  })
})
