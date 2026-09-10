import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { eq } from 'drizzle-orm'
import type { AuthorityKey } from '@pos/contract'
import { roles, staff } from '../db/schema'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

/**
 * 操作者權限驗證。requireDeviceToken 只驗證「這台裝置合法」，不知道操作者
 * 是誰——過去所有寫入 API 只掛裝置憑證，等於同店任何一台已核發裝置都能
 * 繞過畫面按鈕的禁用狀態直接執行操作。這裡透過操作員登入時記住的
 * X-Staff-Id（見 apps/pos/src/api/http.ts）解析出目前操作者與其角色能力，
 * 比照前端 hasCapability() 用的同一份規則，在伺服端也擋一次。
 */
async function resolveCapabilities(db: AnyDb, staffId: string | null): Promise<AuthorityKey[] | null> {
  if (!staffId) return null
  const staffRow = await db.select().from(staff).where(eq(staff.id, staffId)).get()
  if (!staffRow) return null
  const role = await db.select().from(roles).where(eq(roles.id, staffRow.roleId)).get()
  return role?.capabilities ?? null
}

export type CapabilityCheckResult = { ok: true } | { ok: false; status: 401 | 403; message: string }

/**
 * 檢查目前操作者是否具備指定權限。回傳判定結果（不是 Response）：openapi
 * 路由的 handler 回傳值會依 responses 宣告做型別檢查，這裡若直接回傳
 * `c.json(...)` 組出來的 Response，型別會對不上呼叫端那個更具體的路由
 * 型別，所以交給呼叫端自己用它那個 `c` 組錯誤回應。給 orders.ts 的訂單
 * 狀態變更這種「所需權限要看請求內容才決定」的路由直接呼叫；一般路由請用
 * 下面的 requireCapability() 中介軟體。
 */
export async function checkCapability(c: Context<AppEnv>, key: AuthorityKey): Promise<CapabilityCheckResult> {
  const staffId = c.req.header('X-Staff-Id') ?? null
  const capabilities = await resolveCapabilities(c.get('db'), staffId)
  if (capabilities === null) {
    return { ok: false, status: 401, message: staffId ? '操作員身分無效' : '缺少操作員身分（X-Staff-Id）' }
  }
  if (!capabilities.includes(key)) {
    return { ok: false, status: 403, message: '這個帳號沒有執行此操作的權限' }
  }
  return { ok: true }
}

/** 必須接在 requireDeviceToken 之後掛用。 */
export function requireCapability(key: AuthorityKey) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const result = await checkCapability(c, key)
    if (!result.ok) return c.json({ error: result.message }, result.status)
    await next()
  })
}
