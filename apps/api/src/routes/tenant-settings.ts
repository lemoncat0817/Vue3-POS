import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { tenantSettingsSchema, updateTenantSettingsRequestSchema } from '@pos/contract'
import {
  DEFAULT_BUSINESS_DAY_START_HOUR,
  DEFAULT_POINTS_PER_CURRENCY_UNIT,
  DEFAULT_POINTS_REDEMPTION_RATE
} from '@pos/domain'
import { recordAuditLog } from '../audit/record'
import { users } from '../db/schema'
import { checkCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { tenantFilter } from '../db/tenant-scope'
import type { AppEnv } from '../types'

const errorSchema = z.object({ error: z.string() })

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
  method: 'patch',
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
    const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
    return c.json(
      tenantSettingsSchema.parse({
        businessDayStartHour: tenant?.businessDayStartHour ?? DEFAULT_BUSINESS_DAY_START_HOUR,
        pointsPerCurrencyUnit: tenant?.pointsPerCurrencyUnit ?? DEFAULT_POINTS_PER_CURRENCY_UNIT,
        pointsRedemptionRate: tenant?.pointsRedemptionRate ?? DEFAULT_POINTS_REDEMPTION_RATE,
        pointsExpiryMonths: tenant?.pointsExpiryMonths ?? null,
        autoOccupyTableOnCheckout: tenant?.autoOccupyTableOnCheckout ?? true
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
    if (
      input.pointsPerCurrencyUnit !== undefined ||
      input.pointsRedemptionRate !== undefined ||
      input.pointsExpiryMonths !== undefined
    ) {
      const check = await checkCapability(c, 'canManageMembers')
      if (!check.ok) return c.json({ error: check.message }, check.status)
    }
    if (input.autoOccupyTableOnCheckout !== undefined) {
      const check = await checkCapability(c, 'canManageTables')
      if (!check.ok) return c.json({ error: check.message }, check.status)
    }

    const tenant = await db.select().from(users).where(tenantFilter(users.id, tenantId)).get()
    if (!tenant) return c.json({ error: '找不到這個租戶（裝置尚未分配租戶）' }, 404)
    // 需區分 undefined（未傳）與 null（停用到期規則），不可使用 ?? 運算子
    const nextPointsExpiryMonths =
      input.pointsExpiryMonths !== undefined ? input.pointsExpiryMonths : tenant.pointsExpiryMonths
    await db
      .update(users)
      .set({
        ...(input.businessDayStartHour !== undefined && {
          businessDayStartHour: input.businessDayStartHour
        }),
        ...(input.pointsPerCurrencyUnit !== undefined && {
          pointsPerCurrencyUnit: input.pointsPerCurrencyUnit
        }),
        ...(input.pointsRedemptionRate !== undefined && {
          pointsRedemptionRate: input.pointsRedemptionRate
        }),
        ...(input.pointsExpiryMonths !== undefined && {
          pointsExpiryMonths: input.pointsExpiryMonths
        }),
        ...(input.autoOccupyTableOnCheckout !== undefined && {
          autoOccupyTableOnCheckout: input.autoOccupyTableOnCheckout
        })
      })
      .where(eq(users.id, tenant.id))

    const changedFields: string[] = []
    if (input.businessDayStartHour !== undefined) {
      changedFields.push(`營業日換日時間：${input.businessDayStartHour} 點`)
    }
    if (input.pointsPerCurrencyUnit !== undefined) {
      changedFields.push(`每消費 ${input.pointsPerCurrencyUnit} 元累加 1 點`)
    }
    if (input.pointsRedemptionRate !== undefined) {
      changedFields.push(`每 ${input.pointsRedemptionRate} 點折抵 1 元`)
    }
    if (input.pointsExpiryMonths !== undefined) {
      changedFields.push(
        input.pointsExpiryMonths === null ? '點數到期規則：停用' : `點數 ${input.pointsExpiryMonths} 個月未異動即歸零`
      )
    }
    if (input.autoOccupyTableOnCheckout !== undefined) {
      changedFields.push(`內用結帳自動標記桌位使用中：${input.autoOccupyTableOnCheckout ? '開啟' : '關閉'}`)
    }
    await recordAuditLog(c, 'tenantSettings.update', `更新營業設定（${changedFields.join('、')}）`)

    return c.json(
      tenantSettingsSchema.parse({
        businessDayStartHour: input.businessDayStartHour ?? tenant.businessDayStartHour,
        pointsPerCurrencyUnit: input.pointsPerCurrencyUnit ?? tenant.pointsPerCurrencyUnit,
        pointsRedemptionRate: input.pointsRedemptionRate ?? tenant.pointsRedemptionRate,
        pointsExpiryMonths: nextPointsExpiryMonths,
        autoOccupyTableOnCheckout:
          input.autoOccupyTableOnCheckout ?? tenant.autoOccupyTableOnCheckout
      }),
      200
    )
  })
