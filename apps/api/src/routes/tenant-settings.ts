import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { tenantSettingsSchema, updateTenantSettingsRequestSchema } from '@pos/contract'
import { DEFAULT_BUSINESS_DAY_START_HOUR, DEFAULT_POINTS_PER_CURRENCY_UNIT } from '@pos/domain'
import { users } from '../db/schema'
import { checkCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

/**
 * 租戶層級的營業設定 API。設定直接存在 users 表（tenantId 就是 users.id，
 * 見 db/schema.ts 的既有慣例），不另外開一張 settings 表。
 *
 * 更新採部分更新：換日時間需要 canSetBusinessHours，點數比例（業主自訂
 * 「消費多少元累加 1 點」）需要 canManageMembers，兩者分屬不同權限領域，
 * 所以依請求內容動態檢查，沒辦法用靜態 requireCapability() middleware
 * （比照 orders.ts 的 updateOrderStatusRoute）。
 */
const getTenantSettingsRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '目前的租戶營業設定',
      content: { 'application/json': { schema: tenantSettingsSchema } }
    }
  }
})

const updateTenantSettingsRoute = createRoute({
  method: 'put',
  path: '/',
  middleware: [requireDeviceToken] as const,
  request: {
    body: { content: { 'application/json': { schema: updateTenantSettingsRequestSchema } } }
  },
  responses: {
    200: {
      description: '營業設定更新成功',
      content: { 'application/json': { schema: tenantSettingsSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏、或缺少操作員身分',
      content: { 'application/json': { schema: errorSchema } }
    },
    403: {
      description: '沒有對應欄位所需的權限',
      content: { 'application/json': { schema: errorSchema } }
    },
    404: {
      description: '找不到這個租戶（裝置尚未分配租戶）',
      content: { 'application/json': { schema: errorSchema } }
    }
  }
})

export const tenantSettingsRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getTenantSettingsRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    // 裝置尚未分配租戶（過渡期）時查不到對應的 users 列，退回系統預設值，
    // 不當成錯誤——GET 本來就該是安全、隨時能查的。
    const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
    return c.json(
      tenantSettingsSchema.parse({
        businessDayStartHour: tenant?.businessDayStartHour ?? DEFAULT_BUSINESS_DAY_START_HOUR,
        pointsPerCurrencyUnit: tenant?.pointsPerCurrencyUnit ?? DEFAULT_POINTS_PER_CURRENCY_UNIT
      }),
      200
    )
  })
  .openapi(updateTenantSettingsRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    if (input.businessDayStartHour !== undefined) {
      const check = await checkCapability(c, 'canSetBusinessHours')
      if (!check.ok) return c.json({ error: check.message }, check.status)
    }
    if (input.pointsPerCurrencyUnit !== undefined) {
      const check = await checkCapability(c, 'canManageMembers')
      if (!check.ok) return c.json({ error: check.message }, check.status)
    }

    const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
    if (!tenant) return c.json({ error: '找不到這個租戶（裝置尚未分配租戶）' }, 404)
    await db
      .update(users)
      .set({
        ...(input.businessDayStartHour !== undefined && {
          businessDayStartHour: input.businessDayStartHour
        }),
        ...(input.pointsPerCurrencyUnit !== undefined && {
          pointsPerCurrencyUnit: input.pointsPerCurrencyUnit
        })
      })
      .where(eq(users.id, tenant.id))
    return c.json(
      tenantSettingsSchema.parse({
        businessDayStartHour: input.businessDayStartHour ?? tenant.businessDayStartHour,
        pointsPerCurrencyUnit: input.pointsPerCurrencyUnit ?? tenant.pointsPerCurrencyUnit
      }),
      200
    )
  })
