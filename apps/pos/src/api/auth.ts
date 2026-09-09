import { operatorLoginRequestSchema, operatorLoginResponseSchema, type Staff } from '@pos/contract'
import type { StaffMember } from '@/types/staff'
import { fetchJson } from './http'

/** 對應 POST /api/auth/operator-login。帳號或 PIN 錯誤、裝置憑證無效、帳號被鎖定都是 401，見 fetchJson 的 ApiError。 */
export async function operatorLogin(account: string, pin: string): Promise<Staff> {
  const body = operatorLoginRequestSchema.parse({ account, pin })
  const res = await fetchJson<unknown>('/api/auth/operator-login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return operatorLoginResponseSchema.parse(res)
}

/** 將伺服端 `Staff` 轉為前端元件使用的 `StaffMember` 形狀。 */
export function toStaffMember(staff: Staff): StaffMember {
  return {
    id: staff.id,
    name: staff.name,
    jobTitle: staff.jobTitle,
    account: staff.account,
    // 前端改用 PIN 驗證，password 僅保留以相容 StaffMember 型別。
    password: '',
    roleId: staff.roleId,
    roleName: staff.roleName,
    authorityCheckList: staff.capabilities,
  }
}
