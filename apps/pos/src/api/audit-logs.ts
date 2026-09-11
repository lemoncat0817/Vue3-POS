import { auditLogSchema, type AuditLog, type CreateAuditLogRequest } from '@pos/contract'
import { fetchJson } from './http'

/** 建立稽核紀錄（取代舊版僅在前端 console 印出 log 的做法）。 */
export async function createAuditLog(input: CreateAuditLogRequest): Promise<AuditLog> {
  const body = await fetchJson<unknown>('/api/audit-logs', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return auditLogSchema.parse(body)
}
