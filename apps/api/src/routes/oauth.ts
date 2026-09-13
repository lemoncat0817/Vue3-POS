import { Hono } from 'hono'
import type { Context } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { githubAuth } from '@hono/oauth-providers/github'
import { recordAuditLog } from '../audit/record'
import { upsertOAuthUser } from '../auth/oauth-user'
import { issueWebSession } from '../auth/web-session'
import { ensureTenantOnboarded, provisionDeviceForLogin } from '../auth/onboarding'
import type { AnyDb } from '../db/types'
import type { AppEnv } from '../types'

export type OAuthConfig = {
  frontendUrl: string
  googleClientId: string
  googleClientSecret: string
  githubClientId: string
  githubClientSecret: string
}

const DEFAULT_DEVICE_NAME = '總店-機台A'

// token 置於 URL fragment，避免寫入 query string 洩漏至伺服器紀錄或 Referer
function buildRedirect(frontendUrl: string, params: Record<string, string>): string {
  const fragment = new URLSearchParams(params).toString()
  return `${frontendUrl}#${fragment}`
}

async function completeLogin(
  c: Context<AppEnv>,
  frontendUrl: string,
  userId: string,
  provider: 'google' | 'github',
  deviceName: string,
  operatorLabel: string
): Promise<Response> {
  const db: AnyDb = c.get('db')
  const sessionToken = await issueWebSession(db, userId)
  const onboarding = await ensureTenantOnboarded(db, userId)
  const deviceToken = await provisionDeviceForLogin(db, userId, deviceName)

  c.set('tenantId', userId)
  await recordAuditLog(
    c,
    'auth.oauthLogin',
    `使用 ${provider === 'google' ? 'Google' : 'GitHub'} 帳號登入後台管理`,
    operatorLabel
  )

  const params: Record<string, string> = {
    session: sessionToken,
    device: deviceToken,
    provider
  }
  if (onboarding) {
    params.ownerAccount = onboarding.ownerAccount
    params.ownerPin = onboarding.ownerPin
  }
  return c.redirect(buildRedirect(frontendUrl, params))
}

export function createOAuthRoutes(config: OAuthConfig) {
  const app = new Hono<AppEnv>()

  app.get(
    '/google',
    googleAuth({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      scope: ['openid', 'email', 'profile'],
      // 強制跳出帳號選擇畫面，避免瀏覽器自動沿用既有 Google session
      prompt: 'select_account'
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
      return completeLogin(
        c,
        config.frontendUrl,
        userId,
        'google',
        DEFAULT_DEVICE_NAME,
        profile.name ?? profile.email
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
        // GitHub email 未公開時退回 noreply 格式，滿足 NOT NULL 約束
        email: profile.email ?? `${profile.id}+${profile.login}@users.noreply.github.com`,
        displayName: profile.name ?? profile.login ?? String(profile.id),
        avatarUrl: profile.avatar_url ?? null
      })
      return completeLogin(
        c,
        config.frontendUrl,
        userId,
        'github',
        DEFAULT_DEVICE_NAME,
        profile.name ?? profile.login ?? String(profile.id)
      )
    }
  )

  return app
}
