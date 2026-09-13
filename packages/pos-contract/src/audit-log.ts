import { z } from 'zod'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'

/**
 * 稽核紀錄 schema。取代原本只印在瀏覽器主控台的做法，記錄需要較高權限、
 * 屬於「管理者異動」性質的後台操作——不含訂單狀態的例行流轉、桌況的
 * 入座/清空/預約這類高頻操作性狀態變更。
 */
export const auditLogActionSchema = z.enum([
  'cashier_open',
  'report.export',
  'staff.login',
  'staff.loginFailed',
  'staff.logout',
  'auth.oauthLogin',
  'device.issue',
  'staff.create',
  'staff.update',
  'staff.delete',
  'role.create',
  'role.update',
  'role.delete',
  'device.revoke',
  'category.create',
  'category.update',
  'category.delete',
  'product.create',
  'product.update',
  'product.delete',
  'modifierGroup.create',
  'modifierGroup.update',
  'modifierGroup.delete',
  'orderCoupon.create',
  'orderCoupon.update',
  'orderCoupon.delete',
  'quickDiscount.create',
  'quickDiscount.update',
  'quickDiscount.delete',
  'paymentMethod.create',
  'paymentMethod.update',
  'paymentMethod.delete',
  'tenantSettings.update',
  'member.create',
  'member.update',
  'member.delete',
  'member.pointsAdjust',
  'memberTier.create',
  'memberTier.update',
  'memberTier.delete',
  'table.create',
  'table.update',
  'table.delete',
  'order.void',
  'order.refund',
  'order.delete',
  'shift.open',
  'shift.close',
  'shift.cashMovement'
])
export type AuditLogAction = z.infer<typeof auditLogActionSchema>

export const auditLogSchema = z.object({
  id: z.number().int(),
  action: auditLogActionSchema,
  operator: z.string().min(1),
  detail: z.string(),
  createdAt: z.string()
})
export type AuditLog = z.infer<typeof auditLogSchema>

export const createAuditLogRequestSchema = z.object({
  action: auditLogActionSchema,
  operator: z.string().min(1),
  detail: z.string()
})
export type CreateAuditLogRequest = z.infer<typeof createAuditLogRequestSchema>

// 列表頁查詢參數：分頁＋進階篩選，寫法對齊 order.ts 的 listOrdersQuerySchema
// ——dateFrom／dateTo 用 <input type="date"> 原生的 YYYY-MM-DD 格式，直接
// 對應 auditLogs.createdAt（ISO 字串）的日期前綴做字串區間比對。
export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().optional(),
  action: auditLogActionSchema.optional(),
  operator: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '必須是 YYYY-MM-DD 格式').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '必須是 YYYY-MM-DD 格式').optional()
})
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>

export const auditLogListResponseSchema = createPaginatedResponseSchema(auditLogSchema)
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>
