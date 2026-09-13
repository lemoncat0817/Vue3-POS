import { deviceSchema, type Device, type UpdateDeviceRequest } from '@pos/contract'
import { fetchJson } from './http'

export async function fetchCurrentDevice(): Promise<Device> {
  const body = await fetchJson<unknown>('/api/devices/me')
  return deviceSchema.parse(body)
}

export async function renameDevice(id: string, input: UpdateDeviceRequest): Promise<Device> {
  const body = await fetchJson<unknown>(`/api/devices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  })
  return deviceSchema.parse(body)
}
