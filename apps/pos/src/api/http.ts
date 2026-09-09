/** API 用戶端共用 fetch 封裝，預設指向 localhost:8787。 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

/** 終端機裝置憑證，未設定時異動端點將收到 401。 */
const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_TOKEN as string | undefined

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
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new ApiError(`${init?.method ?? 'GET'} ${path} 失敗：HTTP ${res.status}`, res.status)
  }
  // 204 No Content 無 body，直接回傳 undefined。
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
