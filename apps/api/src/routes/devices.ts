import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import {
  createDeviceRequestSchema,
  createDeviceResponseSchema,
  deviceSchema,
  updateDeviceRequestSchema
} from '@pos/contract'
import { recordAuditLog } from '../audit/record'
import { generateSecureToken, hashToken, sha256Hex } from '../auth/hash'
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

const getCurrentDeviceRoute = createRoute({
  method: 'get',
  path: '/me',
  middleware: [requireDeviceToken] as const,
  responses: {
    200: {
      description: '目前這台裝置的資訊',
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

const renameDeviceRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  middleware: [requireDeviceToken, requireCapability('canManageDevices')] as const,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: { content: { 'application/json': { schema: updateDeviceRequestSchema } } }
  },
  responses: {
    200: {
      description: '裝置名稱更新成功',
      content: { 'application/json': { schema: deviceSchema } }
    },
    401: {
      description: '裝置憑證無效或缺漏、或缺少操作員身分',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    },
    403: {
      description: '沒有 canManageDevices 權限',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    },
    404: {
      description: '找不到這個裝置',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

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
    const { hash, salt } = await hashToken(token)
    const lookupHash = await sha256Hex(token)
    const newDevice: DeviceRow = {
      id: crypto.randomUUID(),
      tenantId: null,
      name: input.name,
      tokenHash: hash,
      tokenSalt: salt,
      lookupHash,
      createdAt: new Date().toISOString(),
      revokedAt: null
    }
    await db.insert(devices).values(newDevice)
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
  .openapi(getCurrentDeviceRoute, async (c) => {
    const db = c.get('db')
    const deviceId = c.get('deviceId')
    const existing = await db.select().from(devices).where(eq(devices.id, deviceId)).get()
    if (!existing) {
      return c.json({ error: '找不到這個裝置' }, 404)
    }
    return c.json(toDeviceResponse(existing), 200)
  })
  .openapi(renameDeviceRoute, async (c) => {
    const { id } = c.req.valid('param')
    const { name } = c.req.valid('json')
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

    await db.update(devices).set({ name }).where(eq(devices.id, id))
    await recordAuditLog(c, 'device.rename', `裝置「${existing.name}」重新命名為「${name}」`)
    return c.json(toDeviceResponse({ ...existing, name }), 200)
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
