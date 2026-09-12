/** API 用戶端共用 fetch 封裝，預設指向 localhost:8787。 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8787'

/**
 * 終端機裝置憑證，未設定時異動端點將收到 401。不再是 build-time 的
 * VITE_DEVICE_TOKEN（那樣會把憑證烤進公開的 GitHub Pages bundle，任何訪客
 * 都拿得到）——改成登入當下才知道的值，由 stores/device.ts 的 watch 同步進來
 * （做法比照下面的 currentOperatorSession）。
 */
let currentDeviceToken: string | null = null
export function setDeviceToken(token: string | null): void {
  currentDeviceToken = token
}
export function getDeviceToken(): string | null {
  return currentDeviceToken
}

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

/** 裝置憑證失效（撤銷／從沒核發過）時的全域回呼，做法同上——導回需要重新用
 *  Google／GitHub 登入配對裝置的畫面（見 router/index.ts 的註冊）。 */
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

/**
 * 用 `.name` 而非 `instanceof ZodError` 判斷——這個 monorepo 裡
 * @pos/contract 用 zod v4、apps/pos 自己用 zod v3（pnpm 因此各自裝了一份，
 * 是兩個不同的模組實例），跨套件 `instanceof` 對不上；兩個版本的 ZodError
 * 都固定把 `name` 設成 "ZodError"，用這個字串比對才不會誤判。
 */
function isZodError(err: unknown): boolean {
  return err instanceof Error && err.name === 'ZodError'
}

/**
 * 各畫面 catch 區塊共用的錯誤轉訊息：ApiError 是伺服端明確拒絕，帶著具體
 * 原因；ZodError 是送出前／解析回應時資料不符合約（例如呼叫端漏做欄位檢查
 * 就直接送出空值），代表的是資料問題而不是斷線，不該跟著顯示「連不上
 * 伺服端」誤導使用者去檢查網路。其餘才歸類為真正的連線／未知錯誤。
 */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return `操作失敗：${err.message}`
  if (isZodError(err)) return '資料格式有誤，請確認欄位內容後再試一次'
  return '連不上伺服端，請確認網路連線'
}

/** 發送 HTTP 請求並解析 JSON；錯誤交由呼叫端或離線快取處理。 */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const deviceTokenSentThisRequest = currentDeviceToken
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(currentDeviceToken ? { 'X-Device-Token': currentDeviceToken } : {}),
      // 呼叫端可透過 init.headers 帶入不同的 X-Operator-Session 覆蓋這裡的
      // 預設值（見 api/orders.ts 的退款／作廢，主管二次授權時要送核可者
      // 剛登入核發的 session，不是目前登入中的操作員）。
      ...(currentOperatorSession ? { 'X-Operator-Session': currentOperatorSession } : {}),
      ...init?.headers
    }
  })
  if (!res.ok) {
    // 盡量帶上伺服端 { error: string } body 的實際訊息（見各 routes 的 errorSchema），
    // 解析失敗（非 JSON、或沒有 error 欄位）時退回原本的通用訊息。
    const serverMessage = await res
      .json()
      .then((body: unknown) =>
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : null
      )
      .catch(() => null)
    // 操作員 session 缺漏或過期是唯一會帶「操作員 session」字樣的 401 訊息
    // ——裝置憑證錯誤與 PIN 登入失敗的 401 都不會，藉此區分不會誤觸強制登出。
    if (res.status === 401 && serverMessage?.includes('操作員 session')) {
      onOperatorSessionInvalid?.()
    }
    // 裝置憑證的錯誤訊息固定是這句（見 middleware/require-device-token.ts），
    // 跟 PIN 登入失敗、帳號鎖定的 401 訊息不會撞在一起。只在這次請求真的
    // 帶了憑證卻被拒絕時才觸發撤銷——deviceTokenSentThisRequest 是 null
    // 代表根本還沒有憑證（router 導頁邏輯已經處理這種情況），不是「這組
    // 憑證失效了」，觸發撤銷只會把剛好還沒 hydrate 完成的合法憑證洗掉。
    if (res.status === 401 && serverMessage === '裝置憑證無效或缺漏' && deviceTokenSentThisRequest) {
      onDeviceTokenInvalid?.()
    }
    throw new ApiError(
      serverMessage ?? `${init?.method ?? 'GET'} ${path} 失敗：HTTP ${res.status}`,
      res.status
    )
  }
  // 204 No Content 無 body，直接回傳 undefined。
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
