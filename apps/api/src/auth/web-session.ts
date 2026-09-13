import { eq, isNull } from 'drizzle-orm'
import { generateSecureToken, hashSecret, verifySecret } from './hash'
import { users, webSessions } from '../db/schema'
import type { AnyDb } from '../db/types'

/** OAuth 登入 session 效期：比照操作員 session（見 auth/operator-session.ts），過期要求重新登入。 */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

/** OAuth 登入成功後核發一組新的瀏覽器 session，回傳明碼 token（只有呼叫端看得到這一次，之後只存雜湊值）。 */
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

/** 找出 token 對應的有效 session（未撤銷、未過期），做法比照 findActiveOperatorSession()。 */
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

/** 解析 web session 對應的 OAuth 使用者，供 requireCapability 的 PIN 重設救援路徑與稽核紀錄使用。 */
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

/** 撤銷一組 session（登出）。找不到或已撤銷都視為成功，登出本身應該是冪等操作。 */
export async function revokeWebSession(db: AnyDb, token: string): Promise<void> {
  const session = await findActiveWebSession(db, token)
  if (!session) return
  await db
    .update(webSessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(webSessions.id, session.id))
}
