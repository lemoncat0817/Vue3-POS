import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createDeviceRequestSchema, createDeviceResponseSchema, deviceSchema } from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { generateSecureToken, hashSecret } from '../auth/hash'
import { devices } from '../db/schema'
import { requireCapability } from '../middleware/require-capability'
import { requireDeviceToken } from '../middleware/require-device-token'
import { requireProvisioningSecret } from '../middleware/require-provisioning-secret'
import { tenantFilter } from '../db/tenant-scope'
import { and } from 'drizzle-orm'
import type { AppEnv } from '../types'

const createDeviceRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireProvisioningSecret] as const,
  request: {
    body: { content: { 'application/json': { schema: createDeviceRequestSchema } } }
  },
  responses: {
    201: {
      description: '裝置憑證核發成功，token 只會出現這一次',
      content: { 'application/json': { schema: createDeviceResponseSchema } }
    },
    401: {
      description: '核發密鑰無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

const listDevicesRoute = createRoute({
  method: 'get',
  path: '/',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '裝置清單（不含憑證本身）',
      content: { 'application/json': { schema: z.array(deviceSchema) } }
    }
  }
})

// 撤銷是破壞性操作（會讓對應的實體終端機立刻無法連線），原本只掛
// requireDeviceToken、完全沒有能力檢查，等於同租戶下任何一台裝置都能撤銷
// 別台裝置的憑證，是全專案唯一沒有權限把關的寫入端點，補上 canManageDevices。
const revokeDeviceRoute = createRoute({
  method: 'post',
  path: '/{id}/revoke',
  middleware: [requireDeviceToken, requireCapability('canManageDevices')] as const,
  request: {
    params: z.object({ id: z.string().min(1) })
  },
  responses: {
    200: {
      description: '裝置憑證已撤銷',
      content: { 'application/json': { schema: deviceSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    },
    404: {
      description: '找不到這個裝置',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

type DeviceRow = typeof devices.$inferSelect

function toDeviceResponse(row: DeviceRow) {
  return deviceSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt
  })
}

export const deviceRoutes = new OpenAPIHono<AppEnv>()
  .openapi(createDeviceRoute, async (c) => {
    const input = c.req.valid('json')
    const db = c.get('db')

    const token = generateSecureToken()
    const { hash, salt } = await hashSecret(token)
    const newDevice: DeviceRow = {
      id: crypto.randomUUID(),
      // 這個端點靠 PROVISIONING_SECRET 保護，還沒有裝置身分可以解出 tenantId
      // ——核發出來的裝置先落在「未分配租戶」的過渡池，Phase 4 的 onboarding
      // 會改用內部函式直接指定 tenantId，不會經過這支公開端點。
      tenantId: null,
      name: input.name,
      tokenHash: hash,
      tokenSalt: salt,
      createdAt: new Date().toISOString(),
      revokedAt: null
    }
    await db.insert(devices).values(newDevice)
    // 這個端點靠核發密鑰保護，還沒有任何員工登入、沒有操作員身分可解析，
    // operator 記固定字串「系統（裝置核發密鑰）」，理由同上面 tenantId 的說明。
    await recordAuditLog(c, 'device.issue', `核發裝置憑證「${input.name}」`, '系統（裝置核發密鑰）')

    return c.json(createDeviceResponseSchema.parse({ ...toDeviceResponse(newDevice), token }), 201)
  })
  .openapi(listDevicesRoute, async (c) => {
    const db = c.get('db')
    const tenantId = c.get('tenantId')
    const rows = await db
      .select()
      .from(devices)
      .where(tenantFilter(devices.tenantId, tenantId))
      .all()
    return c.json(
      rows.map((row) => toDeviceResponse(row)),
      200
    )
  })
  .openapi(revokeDeviceRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = c.get('db')
    const tenantId = c.get('tenantId')

    const existing = await db
      .select()
      .from(devices)
      .where(and(eq(devices.id, id), tenantFilter(devices.tenantId, tenantId)))
      .get()
    if (!existing) {
      return c.json({ error: '找不到這個裝置' }, 404)
    }

    const revokedAt = new Date().toISOString()
    await db.update(devices).set({ revokedAt }).where(eq(devices.id, id))
    await recordAuditLog(c, 'device.revoke', `撤銷裝置憑證「${existing.name}」`)
    return c.json(toDeviceResponse({ ...existing, revokedAt }), 200)
  })
