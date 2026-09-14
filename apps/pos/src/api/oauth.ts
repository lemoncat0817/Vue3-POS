import { API_BASE_URL } from './http'
import type { useDeviceStore } from '@/stores/device'

export const googleLoginUrl = `${API_BASE_URL}/api/auth/google`
export const githubLoginUrl = `${API_BASE_URL}/api/auth/github`

export type OAuthCallbackResult =
  | { status: 'none' }
  | { status: 'error'; error: string }
  | { status: 'success'; provider: string; isNewTenant: boolean }

declare global {
  interface Window {
    // index.html 的內嵌 script 搶在 hash 模式路由初始化前存下的原始 OAuth 回呼 hash
    __oauthCallbackHash?: string
  }
}

// 解析網址 hash 中的憑證寫入 deviceStore 並清除 hash 避免洩漏；優先讀 __oauthCallbackHash，因為 window.location.hash 可能已被 hash 模式路由正規化過而弄壞第一個參數
export function consumeOAuthCallback(
  deviceStore: ReturnType<typeof useDeviceStore>
): OAuthCallbackResult {
  const hash = window.__oauthCallbackHash ?? window.location.hash
  delete window.__oauthCallbackHash
  if (!hash || hash.length <= 1) return { status: 'none' }

  const params = new URLSearchParams(hash.slice(1))
  const error = params.get('error')
  const deviceToken = params.get('device')
  const webSessionToken = params.get('session')
  const provider = params.get('provider')

  if (!error && !deviceToken) return { status: 'none' }

  history.replaceState(null, '', window.location.pathname + window.location.search)

  if (error) {
    return { status: 'error', error }
  }
  if (!deviceToken || !provider) return { status: 'none' }

  deviceStore.deviceToken = deviceToken
  if (webSessionToken) deviceStore.webSessionToken = webSessionToken
  const ownerAccount = params.get('ownerAccount')
  const ownerPin = params.get('ownerPin')
  if (ownerAccount && ownerPin) {
    deviceStore.pendingOwnerAccount = ownerAccount
    deviceStore.pendingOwnerPin = ownerPin
  }

  return { status: 'success', provider, isNewTenant: Boolean(ownerAccount) }
}
