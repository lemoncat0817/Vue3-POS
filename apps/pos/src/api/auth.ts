import {
  operatorLoginRequestSchema,
  operatorLoginResponseSchema,
  type OperatorLoginResponse,
  type Staff
} from '@pos/contract'
import type { StaffMember } from '@/types/staff'
import { fetchJson } from './http'

/** 對應 POST /api/auth/operator-login。帳號或 PIN 錯誤、裝置憑證無效、帳號被鎖定都是 401，見 fetchJson 的 ApiError。 */
export async function operatorLogin(account: string, pin: string): Promise<OperatorLoginResponse> {
  const body = operatorLoginRequestSchema.parse({ account, pin })
  const res = await fetchJson<unknown>('/api/auth/operator-login', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return operatorLoginResponseSchema.parse(res)
}

/**
 * 登出（撤銷 session）。找不到或已撤銷也視為成功，呼叫端不需要特別處理
 * 失敗——本來就是要讓這個 session 失效，撤銷失敗也不該擋住畫面登出。
 */
export async function revokeSession(sessionToken: string): Promise<void> {
  await fetchJson<null>('/api/auth/logout', {
    method: 'POST',
    headers: { 'X-Operator-Session': sessionToken }
  })
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
    authorityCheckList: staff.capabilities
  }
}
