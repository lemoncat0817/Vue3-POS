import { API_BASE_URL } from './http'
import type { useDeviceStore } from '@/stores/device'

/** 整頁導頁到後端的 OAuth 登入路由（見 apps/api/src/routes/oauth.ts），不是 fetch——
 *  OAuth 的使用者同意畫面一定要是瀏覽器的完整導頁，沒辦法用 XHR/fetch 完成。 */
export const googleLoginUrl = `${API_BASE_URL}/api/auth/google`
export const githubLoginUrl = `${API_BASE_URL}/api/auth/github`

export type OAuthCallbackResult =
  | { status: 'none' }
  | { status: 'error'; error: string }
  | { status: 'success'; provider: string; isNewTenant: boolean }

/**
 * 解析 Google／GitHub 登入完成後導回網址上的 URL fragment（見
 * apps/api/src/routes/oauth.ts 的 buildRedirect()：session／device token、
 * 新租戶的 owner 帳密都放在 # 後面，不是 query string，避免被送到伺服器
 * 或留在 Referer）。讀完寫進 deviceStore 並清掉 hash，避免重新整理時
 * 重複處理，也避免瀏覽器紀錄留著這些一次性憑證。
 *
 * 要在任何元件掛載、任何 API 呼叫送出之前執行（見 main.ts），不然
 * App.vue 掛載時就會先送出一批沒有裝置憑證的請求。
 */
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

  // 清掉網址上的 fragment，不留下痕跡；保留目前的 path／query。
  history.replaceState(null, '', window.location.pathname + window.location.search)

  if (error) {
    return { status: 'error', error }
  }
  if (!deviceToken || !provider) return { status: 'none' }

  deviceStore.deviceToken = deviceToken
  // 忘記 PIN 時的重設面板要靠這組 session 打 X-Web-Session（見
  // views/login/index.vue），過去這裡只讀了 device 就把 session 丟掉。
  if (webSessionToken) deviceStore.webSessionToken = webSessionToken
  const ownerAccount = params.get('ownerAccount')
  const ownerPin = params.get('ownerPin')
  if (ownerAccount && ownerPin) {
    deviceStore.pendingOwnerAccount = ownerAccount
    deviceStore.pendingOwnerPin = ownerPin
  }

  return { status: 'success', provider, isNewTenant: Boolean(ownerAccount) }
}
