import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { hashToken } from '../../src/auth/hash'
import { findActiveWebSession, issueWebSession, revokeWebSession } from '../../src/auth/web-session'
import { users, webSessions } from '../../src/db/schema'
import { createTestDb } from '../helpers/db'

async function seedUser(db: ReturnType<typeof createTestDb>, id = 'user-1') {
  await db.insert(users).values({
    id,
    provider: 'google',
    providerAccountId: `google-${id}`,
    email: `${id}@example.com`,
    displayName: id,
    createdAt: new Date().toISOString()
  })
  return id
}

describe('issueWebSession / findActiveWebSession / revokeWebSession', () => {
  it('核發的 token 找得到對應的 session，且指向正確的 userId', async () => {
    const db = createTestDb()
    const userId = await seedUser(db)
    const token = await issueWebSession(db, userId)

    const session = await findActiveWebSession(db, token)
    expect(session?.userId).toBe(userId)
  })

  it('錯誤的 token 找不到 session', async () => {
    const db = createTestDb()
    await seedUser(db)
    expect(await findActiveWebSession(db, 'wrong-token')).toBeNull()
  })

  it('撤銷後同一組 token 就再也找不到，且是冪等操作（重複撤銷不報錯）', async () => {
    const db = createTestDb()
    const userId = await seedUser(db)
    const token = await issueWebSession(db, userId)

    await revokeWebSession(db, token)
    expect(await findActiveWebSession(db, token)).toBeNull()

    await expect(revokeWebSession(db, token)).resolves.toBeUndefined()
    await expect(revokeWebSession(db, 'never-issued')).resolves.toBeUndefined()
  })

  it('同一個使用者可以同時擁有多組 session（多裝置登入），互不影響', async () => {
    const db = createTestDb()
    const userId = await seedUser(db)
    const tokenA = await issueWebSession(db, userId)
    const tokenB = await issueWebSession(db, userId)

    await revokeWebSession(db, tokenA)
    expect(await findActiveWebSession(db, tokenA)).toBeNull()
    expect((await findActiveWebSession(db, tokenB))?.userId).toBe(userId)
  })

  it('沒有 lookupHash 的舊資料（雜湊演算法變更前核發）視為失效，不會被掃描出來', async () => {
    const db = createTestDb()
    const userId = await seedUser(db)
    const token = 'legacy-token-without-lookup-hash'
    const { hash, salt } = await hashToken(token)
    await db.insert(webSessions).values({
      id: 'legacy-session',
      userId,
      tokenHash: hash,
      tokenSalt: salt,
      lookupHash: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null
    })

    expect(await findActiveWebSession(db, token)).toBeNull()
  })

  it('核發新 session 時會順手清掉已過期（未撤銷）的舊 session', async () => {
    const db = createTestDb()
    const userId = await seedUser(db)
    await db.insert(webSessions).values({
      id: 'expired-session',
      userId,
      tokenHash: 'irrelevant',
      tokenSalt: 'irrelevant',
      lookupHash: 'irrelevant',
      createdAt: new Date(Date.now() - 120_000).toISOString(),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      revokedAt: null
    })

    await issueWebSession(db, userId)

    const remaining = await db.select().from(webSessions).where(eq(webSessions.id, 'expired-session')).get()
    expect(remaining).toBeUndefined()
  })
})
