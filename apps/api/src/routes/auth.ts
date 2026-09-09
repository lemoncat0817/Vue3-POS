import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { operatorLoginRequestSchema, operatorLoginResponseSchema } from '@pos/contract'
import { verifySecret } from '../auth/hash'
import { staff } from '../db/schema'
import { requireDeviceToken } from '../middleware/require-device-token'
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
    body: { content: { 'application/json': { schema: operatorLoginRequestSchema } } },
  },
  responses: {
    200: {
      description: '登入成功',
      content: { 'application/json': { schema: operatorLoginResponseSchema } },
    },
    401: {
      description: '裝置憑證無效、或帳號密碼錯誤、或帳號已鎖定',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
})

export const authRoutes = new OpenAPIHono<AppEnv>().openapi(operatorLoginRoute, async (c) => {
  const { account, pin } = c.req.valid('json')
  const db = c.get('db')

  // 帳號不存在跟 PIN 錯誤回傳同一句話，不洩漏「這個帳號存不存在」。
  const invalidCredentials = () => c.json({ error: '帳號或 PIN 錯誤' }, 401)

  const row = await db.select().from(staff).where(eq(staff.account, account)).get()
  if (!row) {
    return invalidCredentials()
  }

  const now = new Date()
  if (row.lockedUntil && new Date(row.lockedUntil) > now) {
    return c.json({ error: '帳號已鎖定，請稍後再試' }, 401)
  }

  const ok = await verifySecret(pin, row.pinHash, row.pinSalt)
  if (!ok) {
    const attempts = row.failedPinAttempts + 1
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString() : null
    await db.update(staff).set({ failedPinAttempts: attempts, lockedUntil }).where(eq(staff.account, account))
    return invalidCredentials()
  }

  // 登入成功，重置錯誤次數與鎖定狀態。
  await db.update(staff).set({ failedPinAttempts: 0, lockedUntil: null }).where(eq(staff.account, account))

  return c.json(
    operatorLoginResponseSchema.parse({
      id: row.id,
      name: row.name,
      jobTitle: row.jobTitle,
      account: row.account,
      capabilities: row.capabilities,
    }),
    200,
  )
})
