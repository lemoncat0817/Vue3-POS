import { and, eq } from 'drizzle-orm'
import { users } from '../db/schema'
import type { AnyDb } from '../db/types'

export type OAuthProvider = 'google' | 'github'

export type OAuthProfile = {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  displayName: string
  avatarUrl: string | null
}

/**
 * 以 (provider, providerAccountId) 找對應的 users 列，找不到就新建；每次登入
 * 都拿最新的 email／displayName／avatarUrl 覆蓋，避免資料在 Google／GitHub
 * 那邊改了名稱或頭像後這裡一直是舊的。回傳的 id 就是這個使用者的租戶邊界
 * （見 db/schema.ts 的 users 說明）。
 */
export async function upsertOAuthUser(db: AnyDb, profile: OAuthProfile): Promise<string> {
  const existing = await db
    .select()
    .from(users)
    .where(
      and(eq(users.provider, profile.provider), eq(users.providerAccountId, profile.providerAccountId))
    )
    .get()

  if (existing) {
    await db
      .update(users)
      .set({
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl
      })
      .where(eq(users.id, existing.id))
    return existing.id
  }

  const id = crypto.randomUUID()
  await db.insert(users).values({
    id,
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
    email: profile.email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    createdAt: new Date().toISOString()
  })
  return id
}
