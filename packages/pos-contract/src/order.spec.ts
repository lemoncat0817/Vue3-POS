import { describe, expect, it } from 'vitest'
import { createOrderRequestSchema } from './order'

const validLine = {
  name: '楊枝甘露2.0',
  price: 80,
  size: 'L',
  count: 1,
  addList: '無添加配料' as const,
  addListPrice: 0,
  freeDiscount: false,
  ecoDiscount: false,
  bottleDiscount: false,
  oftenUseDiscount1: false,
  oftenUseDiscount2: false,
  oftenUseDiscount3: false,
}

const validRequest = {
  idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  businessDate: '20240610',
  staff: '店長 - Lemon',
  lines: [validLine],
  bagCount: 0,
  payment: '現金',
  appliedCoupon: { type: 'none' as const },
}

describe('createOrderRequestSchema', () => {
  it('接受合法的送單請求', () => {
    expect(createOrderRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('拒絕不合法的 idempotencyKey（不是 ULID）', () => {
    const result = createOrderRequestSchema.safeParse({ ...validRequest, idempotencyKey: 'not-a-ulid' })
    expect(result.success).toBe(false)
  })

  it('拒絕不合法的 businessDate 格式', () => {
    const result = createOrderRequestSchema.safeParse({ ...validRequest, businessDate: '2024-06-10' })
    expect(result.success).toBe(false)
  })

  it('拒絕空的品項清單', () => {
    const result = createOrderRequestSchema.safeParse({ ...validRequest, lines: [] })
    expect(result.success).toBe(false)
  })

  it('拒絕負數的杯數', () => {
    const result = createOrderRequestSchema.safeParse({
      ...validRequest,
      lines: [{ ...validLine, count: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('appliedCoupon 接受 none／money／percent 三種形狀', () => {
    expect(createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'none' } }).success).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'money', couponId: 'money-1' } })
        .success,
    ).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'percent', couponId: 'percent-1' } })
        .success,
    ).toBe(true)
  })

  it('拒絕缺少 couponId 的 money／percent 折價券', () => {
    expect(createOrderRequestSchema.safeParse({ ...validRequest, appliedCoupon: { type: 'money' } }).success).toBe(
      false,
    )
  })

  it('addList 可以是字面值或字串陣列兩種形狀', () => {
    expect(
      createOrderRequestSchema.safeParse({
        ...validRequest,
        lines: [{ ...validLine, addList: ['芝芝'] }],
      }).success,
    ).toBe(true)
    expect(
      createOrderRequestSchema.safeParse({
        ...validRequest,
        lines: [{ ...validLine, addList: '其他字串' }],
      }).success,
    ).toBe(false)
  })
})
