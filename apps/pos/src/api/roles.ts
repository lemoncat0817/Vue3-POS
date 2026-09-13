import {
  roleSchema,
  type CreateRoleRequest,
  type Role,
  type UpdateRoleRequest
} from '@pos/contract'
import { fetchJson } from './http'

export async function fetchRoleList(): Promise<Role[]> {
  const body = await fetchJson<unknown>('/api/roles')
  return roleSchema.array().parse(body)
}

export async function createRole(input: CreateRoleRequest): Promise<Role> {
  const body = await fetchJson<unknown>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return roleSchema.parse(body)
}

export async function updateRole(id: string, input: UpdateRoleRequest): Promise<Role> {
  const body = await fetchJson<unknown>(`/api/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return roleSchema.parse(body)
}

export async function deleteRole(id: string): Promise<void> {
  await fetchJson<null>(`/api/roles/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
