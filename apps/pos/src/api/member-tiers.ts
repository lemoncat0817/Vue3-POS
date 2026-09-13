import {
  memberTierSchema,
  type CreateMemberTierRequest,
  type MemberTier,
  type UpdateMemberTierRequest
} from '@pos/contract'
import { fetchJson } from './http'

/** 會員分級門檻管理 API 用戶端。 */
export async function fetchMemberTiers(): Promise<MemberTier[]> {
  const body = await fetchJson<unknown>('/api/member-tiers')
  return memberTierSchema.array().parse(body)
}

export async function createMemberTier(input: CreateMemberTierRequest): Promise<MemberTier> {
  const body = await fetchJson<unknown>('/api/member-tiers', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return memberTierSchema.parse(body)
}

export async function updateMemberTier(
  id: string,
  input: UpdateMemberTierRequest
): Promise<MemberTier> {
  const body = await fetchJson<unknown>(`/api/member-tiers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return memberTierSchema.parse(body)
}

export async function deleteMemberTier(id: string): Promise<void> {
  await fetchJson<null>(`/api/member-tiers/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
