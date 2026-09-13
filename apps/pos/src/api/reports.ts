import { salesReportSchema, type SalesReport } from '@pos/contract'
import { fetchJson } from './http'

export async function fetchSalesReport(from: string, to: string): Promise<SalesReport> {
  const query = new URLSearchParams({ from, to })
  const body = await fetchJson<unknown>(`/api/reports/sales?${query.toString()}`)
  return salesReportSchema.parse(body)
}
