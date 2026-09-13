import {
  staffSchema,
  type CreateStaffRequest,
  type Staff,
  type UpdateStaffRequest
} from '@pos/contract'
import { fetchJson } from './http'

export async function fetchStaffList(): Promise<Staff[]> {
  const body = await fetchJson<unknown>('/api/staff')
  return staffSchema.array().parse(body)
}

export async function createStaff(input: CreateStaffRequest): Promise<Staff> {
  const body = await fetchJson<unknown>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return staffSchema.parse(body)
}

export async function updateStaff(id: string, input: UpdateStaffRequest): Promise<Staff> {
  const body = await fetchJson<unknown>(`/api/staff/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return staffSchema.parse(body)
}

export async function deleteStaff(id: string): Promise<void> {
  await fetchJson<null>(`/api/staff/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
