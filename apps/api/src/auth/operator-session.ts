import { eq, isNull } from 'drizzle-orm'
import { generateSecureToken, hashSecret, verifySecret } from './hash'
import { operatorSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

/** 操作員 session 效期：比照一個班別的長度，過期後要求重新登入。 */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

/** PIN 登入成功後核發一組新的操作員 session，回傳明碼 token（只有呼叫端看得到這一次，之後只存雜湊值）。 */
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

/** 找出 token 對應的有效 session（未撤銷、未過期）。逐一驗證雜湊值以支援個別核發與單獨撤銷，比照 requireDeviceToken 的作法。 */
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

/** 撤銷一組 session（登出）。找不到或已撤銷都視為成功，登出本身應該是冪等操作。 */
export async function revokeOperatorSession(db: AnyDb, token: string): Promise<void> {
  const session = await findActiveOperatorSession(db, token)
  if (!session) return
  await db
    .update(operatorSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(operatorSessions.id, session.id))
}
