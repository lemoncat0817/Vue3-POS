import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { eq } from 'drizzle-orm'
import type { AuthorityKey } from '@pos/contract'
import { findActiveOperatorSession } from '../auth/operator-session'
import { findActiveWebSession } from '../auth/web-session'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

/**
 * 操作者權限驗證。requireDeviceToken 只驗證「這台裝置合法」，不知道操作者
 * 是誰——過去所有寫入 API 只掛裝置憑證，等於同店任何一台已核發裝置都能
 * 繞過畫面按鈕的禁用狀態直接執行操作。
 *
 * 這裡解析的是操作員登入時核發的 session token（X-Operator-Session，見
 * apps/pos/src/api/http.ts 與 auth/operator-session.ts），不是直接信任
 * 用戶端回報的 staffId——staffId 本身是 GET /api/staff 就查得到的公開
 * 資訊，直接信任等於誰都能填別人的 id 冒充身分；session token 是 PIN
 * 登入成功才會核發、伺服端只存雜湊值、可以單獨撤銷與設定效期。
 */
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
  // 只給「忘記 PIN 也該有救」的操作開，見下面 isTenantOwnerViaWebSession()。
  allowWebSession?: boolean
}

/** X-Web-Session 是否為這個租戶（c.get('tenantId')）本人的有效 OAuth session。 */
async function isTenantOwnerViaWebSession(c: Context<AppEnv>): Promise<boolean> {
  const tenantId = c.get('tenantId')
  const webSessionToken = c.req.header('X-Web-Session') ?? null
  if (!tenantId || !webSessionToken) return false
  const session = await findActiveWebSession(c.get('db'), webSessionToken)
  return session?.userId === tenantId
}

/**
 * 檢查目前操作者是否具備指定權限。回傳判定結果（不是 Response）：openapi
 * 路由的 handler 回傳值會依 responses 宣告做型別檢查，這裡若直接回傳
 * `c.json(...)` 組出來的 Response，型別會對不上呼叫端那個更具體的路由
 * 型別，所以交給呼叫端自己用它那個 `c` 組錯誤回應。給 orders.ts 的訂單
 * 狀態變更這種「所需權限要看請求內容才決定」的路由直接呼叫；一般路由請用
 * 下面的 requireCapability() 中介軟體。
 */
export async function checkCapability(
  c: Context<AppEnv>,
  key: AuthorityKey,
  options: RequireCapabilityOptions = {}
): Promise<CapabilityCheckResult> {
  const sessionToken = c.req.header('X-Operator-Session') ?? null
  const capabilities = await resolveCapabilities(c.get('db'), sessionToken)
  if (capabilities === null) {
    // 忘記 PIN 就沒人打得動 X-Operator-Session，但 OAuth 登入本來就比 PIN 更強、
    // 核發裝置也是同一次登入配對的（見 routes/oauth.ts），驗證屬於同一租戶即可放行。
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

/** 必須接在 requireDeviceToken 之後掛用。 */
export function requireCapability(key: AuthorityKey, options: RequireCapabilityOptions = {}) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const result = await checkCapability(c, key, options)
    if (!result.ok) return c.json({ error: result.message }, result.status)
    await next()
  })
}
