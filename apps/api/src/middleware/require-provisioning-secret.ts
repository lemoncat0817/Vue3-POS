import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

export const requireProvisioningSecret = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Provisioning-Secret')
  if (!provided || provided !== c.get('provisioningSecret')) {
    return c.json({ error: '核發密鑰無效或缺漏' }, 401)
  }
  await next()
})
