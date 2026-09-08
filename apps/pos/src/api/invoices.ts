import {
  invoiceTrackSchema,
  submitInvoicesResponseSchema,
  type CreateInvoiceTrackRequest,
  type InvoiceTrack,
  type SubmitInvoicesResponse,
} from '@pos/contract'
import { fetchJson } from './http'

/**
 * 電子發票字軌與模擬批次上傳（P23：規劃書 §10 P23「電子發票平台
 * 串接」），見 apps/api/src/routes/invoices.ts 的說明。
 */
export async function fetchInvoiceTracks(): Promise<InvoiceTrack[]> {
  const body = await fetchJson<unknown>('/api/invoices/tracks')
  return invoiceTrackSchema.array().parse(body)
}

export async function createInvoiceTrack(input: CreateInvoiceTrackRequest): Promise<InvoiceTrack> {
  const body = await fetchJson<unknown>('/api/invoices/tracks', { method: 'POST', body: JSON.stringify(input) })
  return invoiceTrackSchema.parse(body)
}

export async function submitInvoices(): Promise<SubmitInvoicesResponse> {
  const body = await fetchJson<unknown>('/api/invoices/submit', { method: 'POST' })
  return submitInvoicesResponseSchema.parse(body)
}
