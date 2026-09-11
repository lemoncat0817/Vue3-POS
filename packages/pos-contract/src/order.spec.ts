import { describe, expect, it } from 'vitest'
import { createOrderRequestSchema, invoiceCarrierSchema, tenderInputSchema } from './order'

const validLine = {
  name: '招牌牛肉漢堡',
  price: 80,
  count: 1,
  addList: '無添加配料' as const,
  addListPrice: 0,
  freeDiscount: false,
  quickDiscountId: null
}

const validRequest = {
  idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  businessDate: '20240610',
  staff: '店長 - Lemon',
  lines: [validLine],
  bagCount: 0,
  tenders: [{ method: '現金', amount: 80 }],
  appliedCoupon: { type: 'none' as const },
  orderChannel: '外帶' as const,
  invoiceCarrier: { type: '無載具' as const }
}

describe('createOrderRequestSchema', () => {
  it('接受合法的送單請求', () => {
    expect(createOrderRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('拒絕不合法的 idempotencyKey（不是 ULID）', () => {
    const result = createOrderRequestSchema.safeParse({
      ...validRequest,
      idempotencyKey: 'not-a-ulid'
    })
    expect(result.success).toBe(false)
  })

  it('拒絕不合法的 businessDate 格式', () => {
    const result = createOrderRequestSchema.safeParse({
      ...validRequest,
      businessDate: '2024-06-10'
    })
    expect(result.success).toBe(false)
  })

  it('拒絕空的品項清單', () => {
    const result = createOrderRequestSchema.safeParse({ ...validRequest, lines: [] })
    expect(result.success).toBe(false)
  })

  it('拒絕負數的杯數', () => {
    const result = createOrderRequestSchema.safeParse({
      ...validRequest,
      lines: [{ ...validLine, count: -1 }]
    })
    expect(result.success).toBe(false)
  })

  it('appliedCoupon 接受 none／coupon 兩種形狀', () => {
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'none' } })
        .success
    ).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({
        ...validRequest,
        appliedCoupon: { type: 'coupon', couponId: 'coupon-1' }
      }).success
    ).toBe(true)
  })

  it('拒絕缺少 couponId 的折價券', () => {
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'coupon' } })
        .success
    ).toBe(false)
  })

  it('拒絕空的 tenders', () => {
    const result = createOrderRequestSchema.safeParse({ ...validRequest, tenders: [] })
    expect(result.success).toBe(false)
  })

  it('接受多筆混合支付', () => {
    const result = createOrderRequestSchema.safeParse({
      ...validRequest,
      tenders: [
        { method: '現金', amount: 30, receivedAmount: 50 },
        { method: '信用卡', amount: 50 }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('addList 可以是字面值或字串陣列兩種形狀', () => {
    expect(
      createOrderRequestSchema.safeParse({
        ...validRequest,
        lines: [{ ...validLine, addList: ['芝芝'] }]
      }).success
    ).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({
        ...validRequest,
        lines: [{ ...validLine, addList: '其他字串' }]
      }).success
    ).toBe(false)
  })

  it('orderChannel 只接受內用／外帶', () => {
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, orderChannel: '內用' }).success
    ).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, orderChannel: '外送' }).success
    ).toBe(false)
    const withoutChannel: Record<string, unknown> = { ...validRequest }
    delete withoutChannel.orderChannel
    expect(createOrderRequestSchema.safeParse(withoutChannel).success).toBe(false)
  })

  it('沒有帶 invoiceCarrier 時拒絕', () => {
    const withoutCarrier: Record<string, unknown> = { ...validRequest }
    delete withoutCarrier.invoiceCarrier
    expect(createOrderRequestSchema.safeParse(withoutCarrier).success).toBe(false)
  })
})

describe('invoiceCarrierSchema', () => {
  it('無載具不需要 value', () => {
    expect(invoiceCarrierSchema.safeParse({ type: '無載具' }).success).toBe(true)
  })

  it('手機條碼必須是「/」開頭加 7 碼數字或大寫英文字母', () => {
    expect(invoiceCarrierSchema.safeParse({ type: '手機條碼', value: '/ABC1234' }).success).toBe(
      true
    )
    expect(invoiceCarrierSchema.safeParse({ type: '手機條碼', value: 'ABC1234' }).success).toBe(
      false
    )
    expect(invoiceCarrierSchema.safeParse({ type: '手機條碼', value: '/ABC123' }).success).toBe(
      false
    )
    expect(invoiceCarrierSchema.safeParse({ type: '手機條碼', value: '/abc1234' }).success).toBe(
      false
    )
  })

  it('統一編號必須是 8 碼數字', () => {
    expect(invoiceCarrierSchema.safeParse({ type: '統一編號', value: '12345678' }).success).toBe(
      true
    )
    expect(invoiceCarrierSchema.safeParse({ type: '統一編號', value: '1234567' }).success).toBe(
      false
    )
    expect(invoiceCarrierSchema.safeParse({ type: '統一編號', value: 'abcdefgh' }).success).toBe(
      false
    )
  })
})

describe('tenderInputSchema', () => {
  it('接受沒有 receivedAmount 的非現金支付', () => {
    expect(tenderInputSchema.safeParse({ method: '信用卡', amount: 100 }).success).toBe(true)
  })

  it('接受 receivedAmount 大於等於 amount', () => {
    expect(
      tenderInputSchema.safeParse({ method: '現金', amount: 88, receivedAmount: 100 }).success
    ).toBe(true)
    expect(
      tenderInputSchema.safeParse({ method: '現金', amount: 88, receivedAmount: 88 }).success
    ).toBe(true)
  })

  it('拒絕 receivedAmount 小於 amount（不可能找出負的零錢）', () => {
    expect(
      tenderInputSchema.safeParse({ method: '現金', amount: 88, receivedAmount: 50 }).success
    ).toBe(false)
  })

  it('接受 amount 為 0（折抵到 0 元時仍需一筆 tender 結案）', () => {
    expect(tenderInputSchema.safeParse({ method: '現金', amount: 0 }).success).toBe(true)
  })

  it('拒絕負數的 amount', () => {
    expect(tenderInputSchema.safeParse({ method: '現金', amount: -10 }).success).toBe(false)
  })
})
