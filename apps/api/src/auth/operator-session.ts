import { and, eq, isNull, lte } from 'drizzle-orm'
import { generateSecureToken, hashSecret, sha256Hex, verifySecret } from './hash'
import { operatorSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

// 過期 session 不清會無限累積；搭配核發時順手清，不用另外排程
async function pruneExpiredSessions(db: AnyDb, nowIso: string): Promise<void> {
  await db
    .delete(operatorSessions)
    .where(and(isNull(operatorSessions.revokedAt), lte(operatorSessions.expiresAt, nowIso)))
}

export async function issueOperatorSession(
  db: AnyDb,
  tenantId: string | null,
  staffId: string
): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashSecret(token)
  const lookupHash = await sha256Hex(token)
  const now = new Date()
  await pruneExpiredSessions(db, now.toISOString())
  await db.insert(operatorSessions).values({
    id: crypto.randomUUID(),
    tenantId,
    staffId,
    tokenHash: hash,
    tokenSalt: salt,
    lookupHash,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    revokedAt: null
  })
  return token
}

type OperatorSessionRow = typeof operatorSessions.$inferSelect

export async function findActiveOperatorSession(
  db: AnyDb,
  token: string
): Promise<OperatorSessionRow | null> {
  const now = new Date().toISOString()
  const lookupHash = await sha256Hex(token)

  // 用索引命中取代逐筆 PBKDF2 掃描，避免 session 一多每個請求都變慢
  const candidate = await db
    .select()
    .from(operatorSessions)
    .where(and(eq(operatorSessions.lookupHash, lookupHash), isNull(operatorSessions.revokedAt)))
    .get()
  if (candidate) {
    if (candidate.expiresAt <= now) return null
    if (!(await verifySecret(token, candidate.tokenHash, candidate.tokenSalt))) return null
    return candidate
  }

  // 後備路徑：lookupHash 為 NULL 的舊 session，會隨 TTL 到期被上面的 prune 清空
  const legacyCandidates = await db
    .select()
    .from(operatorSessions)
    .where(and(isNull(operatorSessions.lookupHash), isNull(operatorSessions.revokedAt)))
    .all()
  for (const session of legacyCandidates) {
    if (session.expiresAt <= now) continue
    if (await verifySecret(token, session.tokenHash, session.tokenSalt)) {
      return session
    }
  }
  return null
}

export async function revokeOperatorSession(db: AnyDb, token: string): Promise<void> {
  const session = await findActiveOperatorSession(db, token)
  if (!session) return
  await db
    .update(operatorSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(operatorSessions.id, session.id))
}
