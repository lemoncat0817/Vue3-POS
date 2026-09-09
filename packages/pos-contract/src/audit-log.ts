import { z } from 'zod'

/** 稽核紀錄 schema。將無對應交易的開錢箱等關鍵操作持久化至伺服端。 */
export const auditLogActionSchema = z.enum(['cashier_open'])
export type AuditLogAction = z.infer<typeof auditLogActionSchema>

export const auditLogSchema = z.object({
  id: z.number().int(),
  action: auditLogActionSchema,
  operator: z.string().min(1),
  detail: z.string(),
  createdAt: z.string(),
})
export type AuditLog = z.infer<typeof auditLogSchema>

export const createAuditLogRequestSchema = z.object({
  action: auditLogActionSchema,
  operator: z.string().min(1),
  detail: z.string(),
})
export type CreateAuditLogRequest = z.infer<typeof createAuditLogRequestSchema>
