import {
  memberDetailSchema,
  memberSchema,
  type CreateMemberRequest,
  type Member,
  type MemberDetail,
  type UpdateMemberRequest
} from '@pos/contract'
import { fetchJson } from './http'

/** 會員管理 API 用戶端。 */
export async function fetchMembers(): Promise<Member[]> {
  const body = await fetchJson<unknown>('/api/members')
  return memberSchema.array().parse(body)
}

/** 結帳當下用手機號碼查會員——找不到回傳 null，不是丟例外（沒有這個會員是正常情況，不是錯誤）。 */
export async function findMemberByPhone(phone: string): Promise<Member | null> {
  const body = await fetchJson<unknown>(`/api/members?phone=${encodeURIComponent(phone)}`)
  const results = memberSchema.array().parse(body)
  return results[0] ?? null
}

export async function fetchMemberDetail(id: string): Promise<MemberDetail> {
  const body = await fetchJson<unknown>(`/api/members/${encodeURIComponent(id)}`)
  return memberDetailSchema.parse(body)
}

export async function createMember(input: CreateMemberRequest): Promise<Member> {
  const body = await fetchJson<unknown>('/api/members', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return memberSchema.parse(body)
}

export async function updateMember(id: string, input: UpdateMemberRequest): Promise<Member> {
  const body = await fetchJson<unknown>(`/api/members/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return memberSchema.parse(body)
}

export async function deleteMember(id: string): Promise<void> {
  await fetchJson<null>(`/api/members/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
