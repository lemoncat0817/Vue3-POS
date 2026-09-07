import { salesReportSchema, type SalesReport } from '@pos/contract'
import { fetchJson } from './http'

/**
 * 對應 GET /api/reports/sales（P7：規劃書 §02 缺陷目錄 D-15）。
 *
 * from／to 是 YYYYMMDD 格式的營業日字串（見 @pos/contract 的
 * businessDateSchema），不是 el-date-picker 用的 'YYYY/MM/DD'——轉換
 * 交給呼叫端（views/dataAnalysis/index.vue 的 toBusinessDate()），這裡
 * 只負責呼叫 API 本身。
 */
export async function fetchSalesReport(from: string, to: string): Promise<SalesReport> {
  const query = new URLSearchParams({ from, to })
  const body = await fetchJson<unknown>(`/api/reports/sales?${query.toString()}`)
  return salesReportSchema.parse(body)
}
