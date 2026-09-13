import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { operatorLoginRequestSchema, operatorLoginResponseSchema } from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { verifySecret } from '../auth/hash'
import {
  findActiveOperatorSession,
  issueOperatorSession,
  revokeOperatorSession
} from '../auth/operator-session'
import { roles, staff } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import { and } from 'drizzle-orm'
import type { AppEnv } from '../types'

/** 連續錯誤達此上限後鎖定帳號，防範暴力破解短 PIN。 */
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000

const operatorLoginRoute = createRoute({
  method: 'post',
  path: '/operator-login',
  // 限制僅合法裝置憑證可嘗試操作員登入，防範外部暴力破解。
  middleware: [requireDeviceToken] as const,
  request: {
    body: { content: { 'application/json': { schema: operatorLoginRequestSchema } } }
  },
  responses: {
    200: {
      description: '登入成功',
      content: { 'application/json': { schema: operatorLoginResponseSchema } }
    },
    401: {
      description: '裝置憑證無效、或帳號密碼錯誤、或帳號已鎖定',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  middleware: [requireDeviceToken] as const,
  responses: {
    204: {
      description: '登出成功（session 已撤銷；找不到或已撤銷也視為成功，登出本身是冪等操作）'
    },
    400: {
      description: '缺少操作員 session',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

export const authRoutes = new OpenAPIHono<AppEnv>()
  .openapi(operatorLoginRoute, async (c) => {
    const { account, pin } = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    // 帳號不存在跟 PIN 錯誤回傳同一句話，不洩漏「這個帳號存不存在」。
    const invalidCredentials = () => c.json({ error: '帳號或 PIN 錯誤' }, 401)

    const row = await db
      .select()
      .from(staff)
      .where(and(eq(staff.account, account), tenantFilter(staff.tenantId, tenantId)))
      .get()
    if (!row) {
      // 查無此帳號，沒有 staff 列可以解析身分，operator 直接記攻擊者
      // 輸入的帳號字串——跟一般登入失敗紀錄一樣，記「聲稱的身分」，
      // 這正是暴力破解／帳號列舉的偵測訊號。
      await recordAuditLog(c, 'staff.loginFailed', `登入失敗：帳號「${account}」不存在`, account)
      return invalidCredentials()
    }

    const now = new Date()
    if (row.lockedUntil && new Date(row.lockedUntil) > now) {
      await recordAuditLog(
        c,
        'staff.loginFailed',
        '登入失敗：帳號已鎖定中',
        `${row.jobTitle} - ${row.name}`
      )
      return c.json({ error: '帳號已鎖定，請稍後再試' }, 401)
    }

    const ok = await verifySecret(pin, row.pinHash, row.pinSalt)
    if (!ok) {
      const attempts = row.failedPinAttempts + 1
      const lockedUntil =
        attempts >= MAX_FAILED_ATTEMPTS
          ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString()
          : null
      // 用 row.id 鎖定，不是 account 字串——account 唯一性改成按租戶後，
      // 不同租戶可能有同名帳號，用字串比對會誤更新到別的租戶那筆。
      await db
        .update(staff)
        .set({ failedPinAttempts: attempts, lockedUntil })
        .where(eq(staff.id, row.id))
      await recordAuditLog(
        c,
        'staff.loginFailed',
        `登入失敗：PIN 錯誤（第 ${attempts} 次${lockedUntil ? '，已鎖定 5 分鐘' : ''}）`,
        `${row.jobTitle} - ${row.name}`
      )
      return invalidCredentials()
    }

    // 登入成功，重置錯誤次數與鎖定狀態。
    await db
      .update(staff)
      .set({ failedPinAttempts: 0, lockedUntil: null })
      .where(eq(staff.id, row.id))

    // 權限只存在角色身上，登入回應的 capabilities／roleName 是依 roleId 解析出的結果（見 db/schema.ts）。
    const role = await db.select().from(roles).where(eq(roles.id, row.roleId)).get()
    if (!role) return c.json({ error: '帳號設定異常，請聯絡管理者' }, 401)

    // 核發這次登入的操作員 session（見 auth/operator-session.ts）。後續寫入
    // 請求要帶著它當 X-Operator-Session，伺服端才知道操作的人是誰、有沒有
    // 對應權限（見 middleware/require-capability.ts）——不能再直接信任
    // 用戶端回報的 staffId，那是 GET /api/staff 就查得到的公開資訊。
    const sessionToken = await issueOperatorSession(db, tenantId, row.id)
    await recordAuditLog(c, 'staff.login', '登入成功', `${row.jobTitle} - ${row.name}`)

    return c.json(
      operatorLoginResponseSchema.parse({
        id: row.id,
        name: row.name,
        jobTitle: row.jobTitle,
        account: row.account,
        roleId: role.id,
        roleName: role.name,
        capabilities: role.capabilities,
        sessionToken
      }),
      200
    )
  })
  .openapi(logoutRoute, async (c) => {
    const token = c.req.header('X-Operator-Session')
    if (!token) return c.json({ error: '缺少操作員 session' }, 400)
    const db = c.get('db')
    // 要在撤銷之前解析身分——撤銷後 findActiveOperatorSession 就查不到
    // 這組 session、也就解不出是誰登出了。查無此 session（已撤銷或
    // 從未存在）沒有身分可記，登出本身仍視為成功（冪等），只是不留痕。
    const session = await findActiveOperatorSession(db, token)
    const staffRow = session
      ? await db.select().from(staff).where(eq(staff.id, session.staffId)).get()
      : null
    await revokeOperatorSession(db, token)
    if (staffRow) {
      await recordAuditLog(c, 'staff.logout', '登出', `${staffRow.jobTitle} - ${staffRow.name}`)
    }
    return c.body(null, 204)
  })
