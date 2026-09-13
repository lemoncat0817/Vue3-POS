import {
  memberAnalyticsSchema,
  memberBirthdayEntrySchema,
  memberDetailSchema,
  memberListResponseSchema,
  memberSchema,
  type CreateMemberRequest,
  type ManualPointAdjustmentRequest,
  type Member,
  type MemberAnalytics,
  type MemberBirthdayEntry,
  type MemberDetail,
  type MemberListResponse,
  type UpdateMemberRequest
} from '@pos/contract'
import { fetchJson } from './http'

/** 會員管理 API 用戶端。 */
export async function fetchMembers(
  options: { q?: string | undefined; page?: number | undefined; pageSize?: number | undefined } = {}
): Promise<MemberListResponse> {
  const params = new URLSearchParams()
  if (options.q) params.set('q', options.q)
  if (options.page) params.set('page', String(options.page))
  if (options.pageSize) params.set('pageSize', String(options.pageSize))
  const query = params.toString()
  const body = await fetchJson<unknown>(`/api/members${query ? `?${query}` : ''}`)
  return memberListResponseSchema.parse(body)
}

/** 結帳當下用手機號碼查會員——找不到回傳 null，不是丟例外（沒有這個會員是正常情況，不是錯誤）。 */
export async function findMemberByPhone(phone: string): Promise<Member | null> {
  const body = await fetchJson<unknown>(`/api/members?phone=${encodeURIComponent(phone)}`)
  const result = memberListResponseSchema.parse(body)
  return result.items[0] ?? null
}

export async function fetchMemberDetail(
  id: string,
  options: { ordersPage?: number | undefined; ordersPageSize?: number | undefined } = {}
): Promise<MemberDetail> {
  const params = new URLSearchParams()
  if (options.ordersPage) params.set('page', String(options.ordersPage))
  if (options.ordersPageSize) params.set('pageSize', String(options.ordersPageSize))
  const query = params.toString()
  const body = await fetchJson<unknown>(
    `/api/members/${encodeURIComponent(id)}${query ? `?${query}` : ''}`
  )
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

/** 本月壽星名單（生日行銷）；不帶 month 時伺服端用當下月份。 */
export async function fetchMemberBirthdays(
  month?: string | undefined
): Promise<MemberBirthdayEntry[]> {
  const body = await fetchJson<unknown>(`/api/members/birthdays${month ? `?month=${month}` : ''}`)
  return memberBirthdayEntrySchema.array().parse(body)
}

/** 會員經營摘要（總會員數、本月新增、會員貢獻營收、分級人數分布）。 */
export async function fetchMemberAnalytics(): Promise<MemberAnalytics> {
  const body = await fetchJson<unknown>('/api/members/analytics')
  return memberAnalyticsSchema.parse(body)
}

/** 手動調整點數（客訴補償、活動加點）。 */
export async function adjustMemberPoints(
  id: string,
  input: ManualPointAdjustmentRequest
): Promise<Member> {
  const body = await fetchJson<unknown>(`/api/members/${encodeURIComponent(id)}/points-adjustments`, {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return memberSchema.parse(body)
}
