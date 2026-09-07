/**
 * API 用戶端的共用 fetch 包裝（P3：接上 apps/api）。
 *
 * 基底網址預設指向 `wrangler dev` 的本機位址，本機開發（apps/api 跑
 * `pnpm --filter @pos/api run dev`）不需要額外設定就能直接接上。正式
 * 環境要接哪個網域（部署後的 Workers URL）由建置時的環境變數
 * `VITE_API_BASE_URL` 指定（見 .env.production，未設定時保持本機預設，
 * 正式建置會直接呼叫失敗——這是預期行為，見 fetchJson 的說明）。
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

/**
 * 這台終端機的裝置憑證（P4：規劃書 §9 的身分系統，見 apps/api/src/
 * routes/devices.ts）。建置時用 `VITE_DEVICE_TOKEN` 指定——單店單機
 * 情境下，這是店主部署時跑一次 `POST /api/devices` 拿到憑證後，設進
 * 這台終端機建置環境的值（見 apps/api/README.md 的「核發第一台裝置的
 * 憑證」）。本機開發用 apps/pos/.env.local（.gitignore 已排除，不會
 * 被提交）。沒設定時，異動性端點（送單、員工異動）會收到 401，這是
 * 預期行為，不是要在這裡補一個假的預設值蒙混過去。
 */
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

/**
 * 呼叫 API 並回傳解析後的 JSON。刻意不在這裡吞掉錯誤或提供離線
 * fallback——呼叫端（TanStack Query 的 queryFn）拿到的 reject 就是
 * 「這次真的打不到伺服器」，離線快取（Dexie，見 P3 後續段落）才是
 * 决定「打不到時要顯示什麼」的地方，兩個職責不要混在一起。
 */
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
  return res.json() as Promise<T>
}
