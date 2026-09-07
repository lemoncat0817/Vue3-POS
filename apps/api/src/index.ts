import { createApp } from './app'
import { createDb } from './db/client'
import type { Env } from './env'

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const db = createDb(env.DB)
    const app = createApp(db, { deviceToken: env.DEVICE_TOKEN, provisioningSecret: env.PROVISIONING_SECRET })
    return app.fetch(request, env, ctx)
  },
}
