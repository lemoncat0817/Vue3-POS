import { z } from 'zod'
import { createPaginatedResponseSchema, paginationQuerySchema } from './pagination'

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
  'device.rename',
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
