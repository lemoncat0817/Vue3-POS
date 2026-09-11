import {
  invoiceTrackSchema,
  submitInvoicesResponseSchema,
  type CreateInvoiceTrackRequest,
  type InvoiceTrack,
  type SubmitInvoicesResponse
} from '@pos/contract'
import { fetchJson } from './http'

/** 電子發票字軌與批次上傳 API 用戶端。 */
export async function fetchInvoiceTracks(): Promise<InvoiceTrack[]> {
  const body = await fetchJson<unknown>('/api/invoices/tracks')
  return invoiceTrackSchema.array().parse(body)
}

export async function createInvoiceTrack(input: CreateInvoiceTrackRequest): Promise<InvoiceTrack> {
  const body = await fetchJson<unknown>('/api/invoices/tracks', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return invoiceTrackSchema.parse(body)
}

export async function submitInvoices(): Promise<SubmitInvoicesResponse> {
  const body = await fetchJson<unknown>('/api/invoices/submit', { method: 'POST' })
  return submitInvoicesResponseSchema.parse(body)
}
