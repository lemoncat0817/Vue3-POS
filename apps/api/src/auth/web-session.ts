import { eq, isNull } from 'drizzle-orm'
import { generateSecureToken, hashSecret, verifySecret } from './hash'
import { users, webSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export async function issueWebSession(db: AnyDb, userId: string): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashSecret(token)
  const now = new Date()
  await db.insert(webSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hash,
    tokenSalt: salt,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    revokedAt: null
  })
  return token
}

type WebSessionRow = typeof webSessions.$inferSelect

export async function findActiveWebSession(db: AnyDb, token: string): Promise<WebSessionRow | null> {
  const now = new Date().toISOString()
  const candidates = await db.select().from(webSessions).where(isNull(webSessions.revokedAt)).all()
  for (const session of candidates) {
    if (session.expiresAt <= now) continue
    if (await verifySecret(token, session.tokenHash, session.tokenSalt)) {
      return session
    }
  }
  return null
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
