import { z } from 'zod'
import { paymentUseMethodSchema } from './order'

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
