import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { githubAuth } from '@hono/oauth-providers/github'
import { upsertOAuthUser } from '../auth/oauth-user'
import { issueWebSession } from '../auth/web-session'
import type { AppEnv } from '../types'

export type OAuthConfig = {
  frontendUrl: string
  googleClientId: string
  googleClientSecret: string
  githubClientId: string
  githubClientSecret: string
}

/** 登入完成（或失敗）後導回前端的網址：session token／錯誤訊息放在 URL fragment（#）
 *  而不是 query string——fragment 不會被送到伺服器、也不會進 Referer，比較不容易外流；
 *  前端讀完就用 history.replaceState 清掉，見 Phase 6 的登入頁。 */
function buildRedirect(frontendUrl: string, params: Record<string, string>): string {
  const fragment = new URLSearchParams(params).toString()
  return `${frontendUrl}#${fragment}`
}

/**
 * OAuth 登入路由的工廠函式：跟 authRoutes（PIN 登入）不同，googleAuth／githubAuth
 * middleware 要在建路由當下就拿到真正的 client_id／client_secret，沒辦法像
 * requireDeviceToken 那樣延後到請求進來時才從 context 解析，所以整支路由要在
 * createApp() 裡帶著 config 現組，不能是模組載入時就建好的靜態實例。
 */
export function createOAuthRoutes(config: OAuthConfig) {
  const app = new Hono<AppEnv>()

  app.get(
    '/google',
    googleAuth({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      scope: ['openid', 'email', 'profile']
    }),
    async (c) => {
      const profile = c.get('user-google')
      if (!profile?.id || !profile.email) {
        return c.redirect(buildRedirect(config.frontendUrl, { error: 'google_login_failed' }))
      }
      const db = c.get('db')
      const userId = await upsertOAuthUser(db, {
        provider: 'google',
        providerAccountId: profile.id,
        email: profile.email,
        displayName: profile.name ?? profile.email,
        avatarUrl: profile.picture ?? null
      })
      const sessionToken = await issueWebSession(db, userId)
      return c.redirect(
        buildRedirect(config.frontendUrl, { session: sessionToken, provider: 'google' })
      )
    }
  )

  app.get(
    '/github',
    githubAuth({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      scope: ['read:user', 'user:email'],
      oauthApp: true
    }),
    async (c) => {
      const profile = c.get('user-github')
      if (!profile?.id) {
        return c.redirect(buildRedirect(config.frontendUrl, { error: 'github_login_failed' }))
      }
      const db = c.get('db')
      const userId = await upsertOAuthUser(db, {
        provider: 'github',
        providerAccountId: String(profile.id),
        // GitHub 的 email 沒公開時是 null（見 auth/oauth-user.ts 的型別），退回
        // GitHub 官方的 noreply 格式，避免 users.email 這個 NOT NULL 欄位塞不進去。
        email: profile.email ?? `${profile.id}+${profile.login}@users.noreply.github.com`,
        displayName: profile.name ?? profile.login ?? String(profile.id),
        avatarUrl: profile.avatar_url ?? null
      })
      const sessionToken = await issueWebSession(db, userId)
      return c.redirect(
        buildRedirect(config.frontendUrl, { session: sessionToken, provider: 'github' })
      )
    }
  )

  return app
}
