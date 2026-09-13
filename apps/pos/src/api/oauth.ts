import { API_BASE_URL } from './http'
import type { useDeviceStore } from '@/stores/device'

export const googleLoginUrl = `${API_BASE_URL}/api/auth/google`
export const githubLoginUrl = `${API_BASE_URL}/api/auth/github`

export type OAuthCallbackResult =
  | { status: 'none' }
  | { status: 'error'; error: string }
  | { status: 'success'; provider: string; isNewTenant: boolean }

// 解析網址 hash 中的憑證寫入 deviceStore 並清除 hash 避免洩漏
export function consumeOAuthCallback(
  deviceStore: ReturnType<typeof useDeviceStore>
): OAuthCallbackResult {
  const hash = window.location.hash
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
