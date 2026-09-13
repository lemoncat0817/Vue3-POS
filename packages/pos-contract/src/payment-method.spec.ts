import { describe, expect, it } from 'vitest'
import {
  createPaymentMethodRequestSchema,
  paymentMethodSchema,
  updatePaymentMethodRequestSchema
} from './payment-method'

describe('payment method contracts', () => {
  const validMethod = {
    id: 'pay-line',
    name: 'LINE Pay',
    disabled: false,
    useMethod: '掃描' as const
  }

  it('paymentMethodSchema 接受合法付款方式物件', () => {
    expect(paymentMethodSchema.safeParse(validMethod).success).toBe(true)
  })

  it('拒絕不合法的收款方式類型', () => {
    expect(
      paymentMethodSchema.safeParse({
        ...validMethod,
        useMethod: '未知方式'
      }).success
    ).toBe(false)
  })

  it('createPaymentMethodRequestSchema 不包含 id 欄位', () => {
    const req = {
      name: '悠遊卡',
      disabled: false,
      useMethod: '感應' as const
    }
    expect(createPaymentMethodRequestSchema.safeParse(req).success).toBe(true)
    expect(updatePaymentMethodRequestSchema.safeParse(req).success).toBe(true)

    expect(
      createPaymentMethodRequestSchema.safeParse({
        ...req,
        name: ''
      }).success
    ).toBe(false)
  })
})
