import { salesReportSchema, type SalesReport } from '@pos/contract'
import { fetchJson } from './http'

/** 銷售報表查詢（GET /api/reports/sales，參數為 YYYYMMDD 格式）。 */
export async function fetchSalesReport(from: string, to: string): Promise<SalesReport> {
  const query = new URLSearchParams({ from, to })
  const body = await fetchJson<unknown>(`/api/reports/sales?${query.toString()}`)
  return salesReportSchema.parse(body)
}
