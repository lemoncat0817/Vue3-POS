import { z } from 'zod'

/**
 * 稽核紀錄（P21：規劃書 §10 P21「API 安全加固」）。取代原本「沒有對應
 * 交易的開錢箱動作」只印在瀏覽器主控台的做法（見 apps/pos/src/views/
 * home/index.vue 的 openCashier 說明）——那種做法的稽核紀錄跟著分頁
 * 關閉就消失，換一台裝置或清掉瀏覽器資料也看不到。
 *
 * action 目前只有一種，用 enum 而不是自由字串是為了之後好擴充（例如
 * 之後真的串接硬體印表機／錢櫃時，開錢櫃改成由伺服端記錄而不是前端
 * 自己組字串），不是預先過度設計。
 */
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
