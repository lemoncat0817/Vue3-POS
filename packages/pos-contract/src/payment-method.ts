import { z } from 'zod'
import { paymentUseMethodSchema } from './order'

/** 付款方式設定 schema。後台控制允許啟用的收款方式；tender 的 method 則保持開放字串以容許離線與新方式。 */
export const paymentMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  disabled: z.boolean(),
  useMethod: paymentUseMethodSchema
})
export type PaymentMethodRecord = z.infer<typeof paymentMethodSchema>

export const createPaymentMethodRequestSchema = paymentMethodSchema.omit({ id: true })
export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodRequestSchema>

export const updatePaymentMethodRequestSchema = createPaymentMethodRequestSchema
export type UpdatePaymentMethodRequest = z.infer<typeof updatePaymentMethodRequestSchema>
