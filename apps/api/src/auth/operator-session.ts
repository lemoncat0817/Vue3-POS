import { eq, isNull } from 'drizzle-orm'
import { generateSecureToken, hashSecret, verifySecret } from './hash'
import { operatorSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export async function issueOperatorSession(
  db: AnyDb,
  tenantId: string | null,
  staffId: string
): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashSecret(token)
  const now = new Date()
  await db.insert(operatorSessions).values({
    id: crypto.randomUUID(),
    tenantId,
    staffId,
    tokenHash: hash,
    tokenSalt: salt,
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
  const candidates = await db
    .select()
    .from(operatorSessions)
    .where(isNull(operatorSessions.revokedAt))
    .all()
  for (const session of candidates) {
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
