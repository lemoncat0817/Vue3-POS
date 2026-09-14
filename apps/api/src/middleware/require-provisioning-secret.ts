import { createMiddleware } from 'hono/factory'
import { timingSafeEqual } from '../auth/hash'
import type { AppEnv } from '../types'

export const requireProvisioningSecret = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Provisioning-Secret')
  if (!provided || !timingSafeEqual(provided, c.get('provisioningSecret'))) {
    return c.json({ error: '核發密鑰無效或缺漏' }, 401)
  }
  await next()
})
