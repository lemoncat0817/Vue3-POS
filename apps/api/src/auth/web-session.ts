import { and, eq, isNull, lte } from 'drizzle-orm'
import { generateSecureToken, hashToken, sha256Hex, verifyToken } from './hash'
import { users, webSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

// 過期 session 不清會無限累積；搭配核發時順手清，不用另外排程
async function pruneExpiredSessions(db: AnyDb, nowIso: string): Promise<void> {
  await db
    .delete(webSessions)
    .where(and(isNull(webSessions.revokedAt), lte(webSessions.expiresAt, nowIso)))
}

export async function issueWebSession(db: AnyDb, userId: string): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashToken(token)
  const lookupHash = await sha256Hex(token)
  const now = new Date()
  await pruneExpiredSessions(db, now.toISOString())
  await db.insert(webSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hash,
    tokenSalt: salt,
    lookupHash,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    revokedAt: null
  })
  return token
}

type WebSessionRow = typeof webSessions.$inferSelect

export async function findActiveWebSession(db: AnyDb, token: string): Promise<WebSessionRow | null> {
  const now = new Date().toISOString()
  const lookupHash = await sha256Hex(token)

  const candidate = await db
    .select()
    .from(webSessions)
    .where(and(eq(webSessions.lookupHash, lookupHash), isNull(webSessions.revokedAt)))
    .get()
  if (!candidate) return null
  if (candidate.expiresAt <= now) return null
  if (!(await verifyToken(token, candidate.tokenHash, candidate.tokenSalt))) return null
  return candidate
}

export async function resolveWebSessionUser(
  db: AnyDb,
  token: string
): Promise<{ userId: string; displayName: string } | null> {
  const session = await findActiveWebSession(db, token)
  if (!session) return null
  const user = await db.select().from(users).where(eq(users.id, session.userId)).get()
  if (!user) return null
  return { userId: session.userId, displayName: user.displayName }
}

export async function revokeWebSession(db: AnyDb, token: string): Promise<void> {
  const session = await findActiveWebSession(db, token)
  if (!session) return
  await db
    .update(webSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(webSessions.id, session.id))
}
