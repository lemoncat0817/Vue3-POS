/**
 * @pos/contract — API 契約單一來源。
 *
 * 排定於重構規劃書 P2（伺服端）階段填入內容：以 Zod 定義請求／回應 schema，
 * 供 Hono（伺服端驗證）、openapi-fetch（用戶端型別）、MSW（測試假伺服器）
 * 三處共用同一份定義，避免契約漂移。
 *
 * P0 階段本檔案僅作為 workspace 套件邊界的佔位，不含任何 schema 定義。
 */
export {}
