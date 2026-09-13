import { describe, expect, it } from 'vitest'
import {
  auditLogActionSchema,
  auditLogSchema,
  createAuditLogRequestSchema,
  listAuditLogsQuerySchema
} from './audit-log'

describe('auditLogActionSchema', () => {
  it('接受定義中的合法操作代碼', () => {
    expect(auditLogActionSchema.safeParse('cashier_open').success).toBe(true)
    expect(auditLogActionSchema.safeParse('staff.login').success).toBe(true)
    expect(auditLogActionSchema.safeParse('category.create').success).toBe(true)
    expect(auditLogActionSchema.safeParse('order.refund').success).toBe(true)
    expect(auditLogActionSchema.safeParse('shift.cashMovement').success).toBe(true)
  })

  it('拒絕不在清單中的動作', () => {
    expect(auditLogActionSchema.safeParse('unknown.action').success).toBe(false)
    expect(auditLogActionSchema.safeParse('').success).toBe(false)
  })
})

describe('auditLogSchema & createAuditLogRequestSchema', () => {
  const validLog = {
    id: 1,
    action: 'staff.login' as const,
    operator: '店長 - Lemon',
    detail: '成功登入系統',
    createdAt: '2025-01-01T00:00:00.000Z'
  }

  it('驗證合法稽核紀錄物件', () => {
    expect(auditLogSchema.safeParse(validLog).success).toBe(true)
  })

  it('拒絕非整數 ID 或缺少 operator 的紀錄', () => {
    expect(auditLogSchema.safeParse({ ...validLog, id: 1.5 }).success).toBe(false)
    expect(auditLogSchema.safeParse({ ...validLog, operator: '' }).success).toBe(false)
  })

  it('驗證建立請求 Schema', () => {
    const validReq = {
      action: 'role.create' as const,
      operator: 'Admin',
      detail: '新增主管權限組'
    }
    expect(createAuditLogRequestSchema.safeParse(validReq).success).toBe(true)
    expect(createAuditLogRequestSchema.safeParse({ ...validReq, operator: '' }).success).toBe(false)
  })
})

describe('listAuditLogsQuerySchema', () => {
  it('解析分頁預設值與可選篩選條件', () => {
    const parsed = listAuditLogsQuerySchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(1)
      expect(parsed.data.pageSize).toBe(20)
    }
  })

  it('驗證日期格式必須符合 YYYY-MM-DD', () => {
    expect(
      listAuditLogsQuerySchema.safeParse({
        dateFrom: '2025-05-01',
        dateTo: '2025-05-31'
      }).success
    ).toBe(true)

    expect(
      listAuditLogsQuerySchema.safeParse({
        dateFrom: '2025/05/01'
      }).success
    ).toBe(false)
  })
})
