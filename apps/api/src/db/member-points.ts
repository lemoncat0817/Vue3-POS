import { and, desc, eq } from 'drizzle-orm'
import { members, memberPointLedger, users } from './schema'
import { tenantFilter } from './tenant-scope'
import type { AnyDb } from './types'

/**
 * 租戶自訂的點數到期規則（會員連續幾個月沒有任何點數異動就整包歸零）。
 * null 代表沒有啟用，點數永久有效——這是預設行為，向下相容既有租戶。
 */
export async function resolvePointsExpiryMonths(
  db: AnyDb,
  tenantId: string | null
): Promise<number | null> {
  const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
  return tenant?.pointsExpiryMonths ?? null
}

/**
 * 惰性檢查並執行點數到期：只在真的讀到這個會員的當下（GET /api/members/:id、
 * 訂單建立時解析掛單會員）順便檢查，不對會員清單頁做——那裡一次撈一整批，
 * 每列都額外查一次異動明細會是 N+1。
 *
 * 到期規則是「整包歸零」而不是逐筆 FIFO 到期：多數小型餐飲業主要的是「躺著
 * 不動的舊會員清掉」，不是精細到每一筆消費各自到期，後者要換一套複雜得多
 * 的點數帳本模型才做得到，目前沒有實際需求要付這個代價。
 *
 * 「最後異動時間」比對用 JS Date 而非 SQL 日期函式，是因為
 * member_point_ledger.createdAt 同時存在 SQLite `CURRENT_TIMESTAMP`（無 T
 * 分隔的格式）跟手動寫入的 `toISOString()`（ISO 8601）兩種格式——V8 對兩者
 * 都能正確解析，只有時區解讀方式不同（前者當地時、後者 UTC），到期規則是
 * 以「月」為粒度，這幾小時的落差不影響判斷結果。
 *
 * 回傳「到期後」的點數餘額，呼叫端後續要用的點數數字（結帳折抵檢查、會員
 * 詳細資料回應）都必須用這個回傳值，不能沿用呼叫前查到的 member.points。
 */
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
