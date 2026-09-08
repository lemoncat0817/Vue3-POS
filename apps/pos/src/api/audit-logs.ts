import { auditLogSchema, type AuditLog, type CreateAuditLogRequest } from '@pos/contract'
import { fetchJson } from './http'

/**
 * 稽核紀錄（P21：規劃書 §10 P21「API 安全加固」）。取代
 * views/home/index.vue 的 openCashier 原本只 `console.info` 的做法，
 * 見 apps/api/src/db/schema.ts 的 auditLogs 說明。
 */
export async function createAuditLog(input: CreateAuditLogRequest): Promise<AuditLog> {
  const body = await fetchJson<unknown>('/api/audit-logs', { method: 'POST', body: JSON.stringify(input) })
  return auditLogSchema.parse(body)
}
