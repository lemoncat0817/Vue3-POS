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
