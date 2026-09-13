import { createMiddleware } from 'hono/factory'
import { isNull } from 'drizzle-orm'
import { verifySecret } from '../auth/hash'
import { devices } from '../db/schema'
import type { AppEnv } from '../types'

/**
 * 裝置憑證驗證中介軟體。查詢 devices 表中未撤銷之裝置，逐一驗證雜湊值以支援個別核發與單獨撤銷。
 */
export const requireDeviceToken = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Device-Token')
  if (!provided) {
    return c.json({ error: '裝置憑證無效或缺漏' }, 401)
  }

  const db = c.get('db')
  const activeDevices = await db.select().from(devices).where(isNull(devices.revokedAt)).all()
  for (const device of activeDevices) {
    if (await verifySecret(provided, device.tokenHash, device.tokenSalt)) {
      // 裝置的 tenantId 就是這次請求的租戶邊界，後面所有查詢都靠這個值過濾
      // （見 db/tenant-scope.ts）。單租戶過渡期資料是 null，等同「不過濾」。
      c.set('tenantId', device.tenantId)
      c.set('deviceId', device.id)
      await next()
      return
    }
  }

  return c.json({ error: '裝置憑證無效或缺漏' }, 401)
})
