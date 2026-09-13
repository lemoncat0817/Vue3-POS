import {
  auditLogListResponseSchema,
  auditLogSchema,
  type AuditLog,
  type AuditLogAction,
  type AuditLogListResponse,
  type CreateAuditLogRequest
} from '@pos/contract'
import { fetchJson } from './http'

/** 建立稽核紀錄（取代舊版僅在前端 console 印出 log 的做法）。 */
export async function createAuditLog(input: CreateAuditLogRequest): Promise<AuditLog> {
  const body = await fetchJson<unknown>('/api/audit-logs', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return auditLogSchema.parse(body)
}

/** 操作紀錄頁的分頁查詢，寫法比照 api/members.ts 的 fetchMembers()。 */
export async function listAuditLogs(
  options: {
    keyword?: string | undefined
    action?: AuditLogAction | undefined
    operator?: string | undefined
    dateFrom?: string | undefined
    dateTo?: string | undefined
    page?: number | undefined
    pageSize?: number | undefined
  } = {}
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams()
  if (options.keyword) params.set('keyword', options.keyword)
  if (options.action) params.set('action', options.action)
  if (options.operator) params.set('operator', options.operator)
  if (options.dateFrom) params.set('dateFrom', options.dateFrom)
  if (options.dateTo) params.set('dateTo', options.dateTo)
  if (options.page) params.set('page', String(options.page))
  if (options.pageSize) params.set('pageSize', String(options.pageSize))
  const query = params.toString()
  const body = await fetchJson<unknown>(`/api/audit-logs${query ? `?${query}` : ''}`)
  return auditLogListResponseSchema.parse(body)
}
