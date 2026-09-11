import { createApp } from './app'
import { createDb } from './db/client'
import type { Env } from './env'

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const db = createDb(env.DB)
    const app = createApp(db, {
      provisioningSecret: env.PROVISIONING_SECRET,
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
      frontendUrl: env.FRONTEND_URL,
      googleClientId: env.GOOGLE_CLIENT_ID,
      googleClientSecret: env.GOOGLE_CLIENT_SECRET,
      githubClientId: env.GITHUB_CLIENT_ID,
      githubClientSecret: env.GITHUB_CLIENT_SECRET
    })
    return app.fetch(request, env, ctx)
  }
}
