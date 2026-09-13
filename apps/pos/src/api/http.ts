export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

let currentDeviceToken: string | null = null
export function setDeviceToken(token: string | null): void {
  currentDeviceToken = token
}
export function getDeviceToken(): string | null {
  return currentDeviceToken
}

let currentOperatorSession: string | null = null
export function setOperatorSession(token: string | null): void {
  currentOperatorSession = token
}

let currentWebSessionToken: string | null = null
export function setWebSessionToken(token: string | null): void {
  currentWebSessionToken = token
}

let onOperatorSessionInvalid: (() => void) | null = null
export function setOperatorSessionInvalidHandler(handler: (() => void) | null): void {
  onOperatorSessionInvalid = handler
}

let onDeviceTokenInvalid: (() => void) | null = null
export function setDeviceTokenInvalidHandler(handler: (() => void) | null): void {
  onDeviceTokenInvalid = handler
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 跨套件 Zod 實例可能不同，比對 name 避免 instanceof 失效
function isZodError(err: unknown): boolean {
  return err instanceof Error && err.name === 'ZodError'
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  if (isZodError(err)) return '資料格式有誤，請確認欄位內容後再試一次'
  return '連不上伺服端，請確認網路連線'
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const deviceTokenSentThisRequest = currentDeviceToken
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(currentDeviceToken ? { 'X-Device-Token': currentDeviceToken } : {}),
      ...(currentOperatorSession ? { 'X-Operator-Session': currentOperatorSession } : {}),
      ...(currentWebSessionToken ? { 'X-Web-Session': currentWebSessionToken } : {}),
      ...init?.headers
    }
  })
  if (!res.ok) {
    const serverMessage = await res
      .json()
      .then((body: unknown) =>
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : null
      )
      .catch(() => null)
    if (res.status === 401 && serverMessage?.includes('操作員 session')) {
      onOperatorSessionInvalid?.()
    }
    // 僅在已帶憑證卻驗證失敗時觸發，避免 hydrate 階段未帶憑證誤觸撤銷
    if (res.status === 401 && serverMessage === '裝置憑證無效或缺漏' && deviceTokenSentThisRequest) {
      onDeviceTokenInvalid?.()
    }
    throw new ApiError(
      serverMessage ?? `${init?.method ?? 'GET'} ${path} 失敗：HTTP ${res.status}`,
      res.status
    )
  }
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
