import { createMiddleware } from 'hono/factory'
import { isNull } from 'drizzle-orm'
import { verifySecret } from '../auth/hash'
import { devices } from '../db/schema'
import type { AppEnv } from '../types'

/**
 * 裝置層級防護（P4：規劃書 §9 的身分系統）。
 *
 * P2 版本比對單一固定字串（環境變數），P4 改成真的查 devices 表：
 * 逐一用 verifySecret() 跟每一台「還沒被撤銷」的裝置比對雜湊值——裝置
 * 數量在單店單機情境下很小（見規劃書 §3 的部署前提），逐筆比對不是
 * 效能問題；換來的是每台裝置可以個別核發、個別撤銷，不再是全店共用
 * 一把、永遠無法單獨作廢的密鑰。
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
      await next()
      return
    }
  }

  return c.json({ error: '裝置憑證無效或缺漏' }, 401)
})
