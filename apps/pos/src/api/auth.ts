import {
  operatorLoginRequestSchema,
  operatorLoginResponseSchema,
  type OperatorLoginResponse,
  type Staff
} from '@pos/contract'
import type { StaffMember } from '@/types/staff'
import { fetchJson } from './http'

export async function operatorLogin(account: string, pin: string): Promise<OperatorLoginResponse> {
  const body = operatorLoginRequestSchema.parse({ account, pin })
  const res = await fetchJson<unknown>('/api/auth/operator-login', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return operatorLoginResponseSchema.parse(res)
}

export async function revokeSession(sessionToken: string): Promise<void> {
  await fetchJson<null>('/api/auth/logout', {
    method: 'POST',
    headers: { 'X-Operator-Session': sessionToken }
  })
}

export function toStaffMember(staff: Staff): StaffMember {
  return {
    id: staff.id,
    name: staff.name,
    jobTitle: staff.jobTitle,
    account: staff.account,
    roleId: staff.roleId,
    roleName: staff.roleName,
    authorityCheckList: staff.capabilities
  }
}
