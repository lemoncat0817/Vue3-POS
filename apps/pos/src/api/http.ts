/** API 用戶端共用 fetch 封裝，預設指向 localhost:8787。 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

/** 終端機裝置憑證，未設定時異動端點將收到 401。 */
const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_TOKEN as string | undefined

/**
 * 目前登入操作員的 session token，PIN 登入成功時核發、隨 loginStore
 * 變動（見 stores/login.ts 的 watch）。伺服端用它解析出真正的操作員身分
 * 與角色能力，擋下沒有對應權限的寫入操作（見 apps/api/src/middleware/
 * require-capability.ts）——不是直接信任用戶端回報的 staffId，那是
 * GET /api/staff 就查得到的公開資訊，直接信任等於誰都能冒充身分；純
 * 裝置憑證也只能證明「這台裝置合法」，證明不了「操作的人是誰」。
 */
let currentOperatorSession: string | null = null
export function setOperatorSession(token: string | null): void {
  currentOperatorSession = token
}

/**
 * 操作員 session 失效時的全域回呼（見 router/index.ts 註冊：強制登出＋導回登入頁）。
 * 用回呼而不是直接在這裡 import store／router，是為了避免 http.ts 被
 * stores/login.ts（設定 X-Operator-Session）與 router（導頁）互相 import 形成循環依賴。
 */
let onOperatorSessionInvalid: (() => void) | null = null
export function setOperatorSessionInvalidHandler(handler: (() => void) | null): void {
  onOperatorSessionInvalid = handler
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 發送 HTTP 請求並解析 JSON；錯誤交由呼叫端或離線快取處理。 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(DEVICE_TOKEN ? { 'X-Device-Token': DEVICE_TOKEN } : {}),
      // 呼叫端可透過 init.headers 帶入不同的 X-Operator-Session 覆蓋這裡的
      // 預設值（見 api/orders.ts 的退款／作廢，主管二次授權時要送核可者
      // 剛登入核發的 session，不是目前登入中的操作員）。
      ...(currentOperatorSession ? { 'X-Operator-Session': currentOperatorSession } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    // 盡量帶上伺服端 { error: string } body 的實際訊息（見各 routes 的 errorSchema），
    // 解析失敗（非 JSON、或沒有 error 欄位）時退回原本的通用訊息。
    const serverMessage = await res
      .json()
      .then((body: unknown) => (body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : null))
      .catch(() => null)
    // 操作員 session 缺漏或過期是唯一會帶「操作員 session」字樣的 401 訊息
    // ——裝置憑證錯誤與 PIN 登入失敗的 401 都不會，藉此區分不會誤觸強制登出。
    if (res.status === 401 && serverMessage?.includes('操作員 session')) {
      onOperatorSessionInvalid?.()
    }
    throw new ApiError(serverMessage ?? `${init?.method ?? 'GET'} ${path} 失敗：HTTP ${res.status}`, res.status)
  }
  // 204 No Content 無 body，直接回傳 undefined。
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
