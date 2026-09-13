import {
  paymentMethodSchema,
  type CreatePaymentMethodRequest,
  type PaymentMethodRecord,
  type UpdatePaymentMethodRequest
} from '@pos/contract'
import { fetchJson } from './http'

export async function fetchPaymentMethods(): Promise<PaymentMethodRecord[]> {
  const body = await fetchJson<unknown>('/api/payment-methods')
  return paymentMethodSchema.array().parse(body)
}

export async function createPaymentMethod(
  input: CreatePaymentMethodRequest
): Promise<PaymentMethodRecord> {
  const body = await fetchJson<unknown>('/api/payment-methods', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return paymentMethodSchema.parse(body)
}

export async function updatePaymentMethod(
  id: string,
  input: UpdatePaymentMethodRequest
): Promise<PaymentMethodRecord> {
  const body = await fetchJson<unknown>(`/api/payment-methods/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return paymentMethodSchema.parse(body)
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await fetchJson<null>(`/api/payment-methods/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
