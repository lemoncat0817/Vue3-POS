import {
  tenantSettingsSchema,
  type TenantSettings,
  type UpdateTenantSettingsRequest
} from '@pos/contract'
import { fetchJson } from './http'

/** 租戶營業設定 API 用戶端。 */
export async function fetchTenantSettings(): Promise<TenantSettings> {
  const body = await fetchJson<unknown>('/api/tenant-settings')
  return tenantSettingsSchema.parse(body)
}

export async function updateTenantSettings(
  input: UpdateTenantSettingsRequest
): Promise<TenantSettings> {
  const body = await fetchJson<unknown>('/api/tenant-settings', {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return tenantSettingsSchema.parse(body)
}
