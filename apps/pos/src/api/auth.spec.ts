import { describe, expect, it, vi } from 'vitest'
import * as httpModule from './http'
import { operatorLogin, revokeSession, toStaffMember } from './auth'
import type { Staff } from '@pos/contract'

describe('auth api client', () => {
  it('toStaffMember() 正確轉換 Staff 格式至前端使用的 StaffMember', () => {
    const staff: Staff = {
      id: 'staff-1',
      name: '王店長',
      jobTitle: '店長',
      account: 'wang',
      roleId: 'role-1',
      roleName: '店長權限組',
      capabilities: ['canOpenCashier', 'canRefundOrVoid'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }

    const member = toStaffMember(staff)
    expect(member).toEqual({
      id: 'staff-1',
      name: '王店長',
      jobTitle: '店長',
      account: 'wang',
      roleId: 'role-1',
      roleName: '店長權限組',
      authorityCheckList: ['canOpenCashier', 'canRefundOrVoid']
    })
  })

  it('operatorLogin() 發送登入請求並驗證回應結構', async () => {
    const mockRes = {
      id: 'staff-1',
      name: '王店長',
      jobTitle: '店長',
      account: 'wang',
      roleId: 'role-1',
      roleName: '店長權限組',
      capabilities: ['canOpenCashier' as const],
      sessionToken: 'sess-abc',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }

    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(mockRes)
    const res = await operatorLogin('wang', '1234')

    expect(spy).toHaveBeenCalledWith('/api/auth/operator-login', expect.objectContaining({ method: 'POST' }))
    expect(res.sessionToken).toBe('sess-abc')
    expect(res.name).toBe('王店長')
  })

  it('revokeSession() 帶入 X-Operator-Session header 執行撤銷', async () => {
    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(null)
    await revokeSession('token-to-revoke')

    expect(spy).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Operator-Session': 'token-to-revoke' }
    })
  })
})
