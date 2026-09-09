import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

/**
 * 裝置核發驗證中介軟體。以獨立的 PROVISIONING_SECRET 保護核發端點，避免尚未持有裝置憑證的新機台無法註冊。
 */
export const requireProvisioningSecret = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Provisioning-Secret')
  if (!provided || provided !== c.get('provisioningSecret')) {
    return c.json({ error: '核發密鑰無效或缺漏' }, 401)
  }
  await next()
})
