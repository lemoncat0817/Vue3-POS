import { and, eq, isNull, lte } from 'drizzle-orm'
import { generateSecureToken, hashToken, sha256Hex, verifyToken } from './hash'
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
  const { hash, salt } = await hashToken(token)
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

  const candidate = await db
    .select()
    .from(operatorSessions)
    .where(and(eq(operatorSessions.lookupHash, lookupHash), isNull(operatorSessions.revokedAt)))
    .get()
  if (!candidate) return null
  if (candidate.expiresAt <= now) return null
  if (!(await verifyToken(token, candidate.tokenHash, candidate.tokenSalt))) return null
  return candidate
}

export async function revokeOperatorSession(db: AnyDb, token: string): Promise<void> {
  const session = await findActiveOperatorSession(db, token)
  if (!session) return
  await db
    .update(operatorSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(operatorSessions.id, session.id))
}
