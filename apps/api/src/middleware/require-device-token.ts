import { createMiddleware } from 'hono/factory'
import { and, eq, isNull } from 'drizzle-orm'
import { sha256Hex, verifyToken } from '../auth/hash'
import { devices } from '../db/schema'
import type { AppEnv } from '../types'

export const requireDeviceToken = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Device-Token')
  if (!provided) {
    return c.json({ error: '裝置憑證無效或缺漏' }, 401)
  }

  const db = c.get('db')
  const lookupHash = await sha256Hex(provided)
  const device = await db
    .select()
    .from(devices)
    .where(and(eq(devices.lookupHash, lookupHash), isNull(devices.revokedAt)))
    .get()

  if (device && (await verifyToken(provided, device.tokenHash, device.tokenSalt))) {
    c.set('tenantId', device.tenantId)
    c.set('deviceId', device.id)
    await next()
    return
  }

  return c.json({ error: '裝置憑證無效或缺漏' }, 401)
})
