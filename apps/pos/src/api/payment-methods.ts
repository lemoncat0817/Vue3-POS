import {
  paymentMethodSchema,
  type CreatePaymentMethodRequest,
  type PaymentMethodRecord,
  type UpdatePaymentMethodRequest,
} from '@pos/contract'
import { fetchJson } from './http'

/**
 * 付款方式管理（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。
 * permissionManagement.vue 原本的付款方式新增／編輯／刪除只改本機
 * Pinia 狀態（見 stores/order.ts 的 paymentList），這裡補上對應的
 * 伺服端呼叫。
 */
export async function fetchPaymentMethods(): Promise<PaymentMethodRecord[]> {
  const body = await fetchJson<unknown>('/api/payment-methods')
  return paymentMethodSchema.array().parse(body)
}

export async function createPaymentMethod(input: CreatePaymentMethodRequest): Promise<PaymentMethodRecord> {
  const body = await fetchJson<unknown>('/api/payment-methods', { method: 'POST', body: JSON.stringify(input) })
  return paymentMethodSchema.parse(body)
}

export async function updatePaymentMethod(id: string, input: UpdatePaymentMethodRequest): Promise<PaymentMethodRecord> {
  const body = await fetchJson<unknown>(`/api/payment-methods/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return paymentMethodSchema.parse(body)
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await fetchJson<null>(`/api/payment-methods/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
