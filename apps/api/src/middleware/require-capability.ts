import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { eq } from 'drizzle-orm'
import type { AuthorityKey } from '@pos/contract'
import { findActiveOperatorSession } from '../auth/operator-session'
import { findActiveWebSession } from '../auth/web-session'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

async function resolveCapabilities(
  db: AnyDb,
  sessionToken: string | null
): Promise<AuthorityKey[] | null> {
  if (!sessionToken) return null
  const session = await findActiveOperatorSession(db, sessionToken)
  if (!session) return null
  const staffRow = await db.select().from(staff).where(eq(staff.id, session.staffId)).get()
  if (!staffRow) return null
  const role = await db.select().from(roles).where(eq(roles.id, staffRow.roleId)).get()
  return role?.capabilities ?? null
}

export type CapabilityCheckResult = { ok: true } | { ok: false; status: 401 | 403; message: string }

export type RequireCapabilityOptions = {
  allowWebSession?: boolean
}

async function isTenantOwnerViaWebSession(c: Context<AppEnv>): Promise<boolean> {
  const tenantId = c.get('tenantId')
  const webSessionToken = c.req.header('X-Web-Session') ?? null
  if (!tenantId || !webSessionToken) return false
  const session = await findActiveWebSession(c.get('db'), webSessionToken)
  return session?.userId === tenantId
}

export async function checkCapability(
  c: Context<AppEnv>,
  key: AuthorityKey,
  options: RequireCapabilityOptions = {}
): Promise<CapabilityCheckResult> {
  const sessionToken = c.req.header('X-Operator-Session') ?? null
  const capabilities = await resolveCapabilities(c.get('db'), sessionToken)
  if (capabilities === null) {
    // 允許同租戶有效 OAuth web session 繞過操作員 session（救援忘記 PIN 等情境）
    if (options.allowWebSession && (await isTenantOwnerViaWebSession(c))) {
      return { ok: true }
    }
    return {
      ok: false,
      status: 401,
      message: sessionToken
        ? '操作員 session 無效或已過期'
        : '缺少操作員 session（X-Operator-Session）'
    }
  }
  if (!capabilities.includes(key)) {
    return { ok: false, status: 403, message: '這個帳號沒有執行此操作的權限' }
  }
  return { ok: true }
}

export function requireCapability(key: AuthorityKey, options: RequireCapabilityOptions = {}) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const result = await checkCapability(c, key, options)
    if (!result.ok) return c.json({ error: result.message }, result.status)
    await next()
  })
}
