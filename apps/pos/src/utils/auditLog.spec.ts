import { describe, expect, it } from 'vitest'
import { AUDIT_ACTION_GROUPS, AUDIT_ACTION_LABELS } from './auditLog'
import type { AuditLogAction } from '@pos/contract'

describe('auditLog utils', () => {
  it('AUDIT_ACTION_LABELS 包含常見操作的中文標籤', () => {
    expect(AUDIT_ACTION_LABELS['cashier_open']).toBe('開啟收銀機')
    expect(AUDIT_ACTION_LABELS['staff.login']).toBe('員工登入')
    expect(AUDIT_ACTION_LABELS['order.refund']).toBe('訂單退款')
    expect(AUDIT_ACTION_LABELS['shift.open']).toBe('開班別')
  })

  it('AUDIT_ACTION_GROUPS 涵蓋所有定義的動作分組', () => {
    expect(AUDIT_ACTION_GROUPS.length).toBeGreaterThan(0)
    const allGroupedActions = AUDIT_ACTION_GROUPS.flatMap((group) => group.actions)

    // 驗證沒有重複的 action 在同一個或不同分組出現
    const uniqueActions = new Set(allGroupedActions)
    expect(uniqueActions.size).toBe(allGroupedActions.length)

    // 驗證每個 group 裡面的 action 都有對應的中文標籤
    for (const action of allGroupedActions) {
      expect(AUDIT_ACTION_LABELS[action as AuditLogAction]).toBeDefined()
    }
  })
})
