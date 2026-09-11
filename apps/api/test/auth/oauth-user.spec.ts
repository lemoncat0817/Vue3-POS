import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { upsertOAuthUser } from '../../src/auth/oauth-user'
import { users } from '../../src/db/schema'
import { createTestDb } from '../helpers/db'

describe('upsertOAuthUser', () => {
  it('第一次登入時新建 users 列，資料跟傳入的 profile 一致', async () => {
    const db = createTestDb()
    const id = await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: 'g-1',
      email: 'lemon@example.com',
      displayName: 'Lemon',
      avatarUrl: 'https://example.com/a.png'
    })

    const row = await db.select().from(users).where(eq(users.id, id)).get()
    expect(row).toMatchObject({
      provider: 'google',
      providerAccountId: 'g-1',
      email: 'lemon@example.com',
      displayName: 'Lemon',
      avatarUrl: 'https://example.com/a.png'
    })
  })

  it('同一個 (provider, providerAccountId) 再登入一次，回傳同一個 id，不會重複建立', async () => {
    const db = createTestDb()
    const first = await upsertOAuthUser(db, {
      provider: 'github',
      providerAccountId: 'gh-1',
      email: 'a@example.com',
      displayName: 'A',
      avatarUrl: null
    })
    const second = await upsertOAuthUser(db, {
      provider: 'github',
      providerAccountId: 'gh-1',
      email: 'a@example.com',
      displayName: 'A',
      avatarUrl: null
    })
    expect(second).toBe(first)

    const all = await db.select().from(users).all()
    expect(all.filter((u) => u.provider === 'github' && u.providerAccountId === 'gh-1')).toHaveLength(1)
  })

  it('再登入時用最新的 email／displayName／avatarUrl 覆蓋舊資料', async () => {
    const db = createTestDb()
    const id = await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: 'g-2',
      email: 'old@example.com',
      displayName: 'Old Name',
      avatarUrl: null
    })
    await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: 'g-2',
      email: 'new@example.com',
      displayName: 'New Name',
      avatarUrl: 'https://example.com/new.png'
    })

    const row = await db.select().from(users).all()
    const updated = row.find((u) => u.id === id)
    expect(updated?.email).toBe('new@example.com')
    expect(updated?.displayName).toBe('New Name')
    expect(updated?.avatarUrl).toBe('https://example.com/new.png')
  })

  it('不同 provider 但 providerAccountId 剛好一樣時，視為不同帳號（各自的 id 不同）', async () => {
    const db = createTestDb()
    const googleId = await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: 'same-id',
      email: 'x@example.com',
      displayName: 'X',
      avatarUrl: null
    })
    const githubId = await upsertOAuthUser(db, {
      provider: 'github',
      providerAccountId: 'same-id',
      email: 'x@example.com',
      displayName: 'X',
      avatarUrl: null
    })
    expect(googleId).not.toBe(githubId)
  })
})
