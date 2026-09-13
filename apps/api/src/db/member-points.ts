import { and, desc, eq } from 'drizzle-orm'
import { members, memberPointLedger, users } from './schema'
import { tenantFilter } from './tenant-scope'
import type { AnyDb } from './types'

export async function resolvePointsExpiryMonths(
  db: AnyDb,
  tenantId: string | null
): Promise<number | null> {
  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  return tenant?.pointsExpiryMonths ?? null
}

// 讀取單一會員時惰性結算到期點數，避免批次列表查詢產生 N+1
export async function maybeExpireMemberPoints(
  db: AnyDb,
  tenantId: string | null,
  member: { id: string; points: number; createdAt: string }
): Promise<number> {
  if (member.points <= 0) return member.points
  const expiryMonths = await resolvePointsExpiryMonths(db, tenantId)
  if (!expiryMonths) return member.points

  const lastEntry = await db
    .select({ createdAt: memberPointLedger.createdAt })
    .from(memberPointLedger)
    .where(eq(memberPointLedger.memberId, member.id))
    .orderBy(desc(memberPointLedger.createdAt))
    .get()
  const lastActivityAt = new Date(lastEntry?.createdAt ?? member.createdAt)

  const threshold = new Date()
  threshold.setMonth(threshold.getMonth() - expiryMonths)
  if (lastActivityAt > threshold) return member.points

  const expiredPoints = member.points
  await db
    .update(members)
    .set({ points: 0 })
    .where(and(eq(members.id, member.id), tenantFilter(members.tenantId, tenantId)))
  await db.insert(memberPointLedger).values({
    id: crypto.randomUUID(),
    tenantId,
    memberId: member.id,
    delta: -expiredPoints,
    reason: 'expiration',
    orderId: null,
    operator: null,
    note: null,
    createdAt: new Date().toISOString()
  })
  return 0
}
