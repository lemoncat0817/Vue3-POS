/** Worker 環境變數：DB (D1)、PROVISIONING_SECRET (裝置核發密鑰)、ALLOWED_ORIGINS (CORS 白名單)、
 *  FRONTEND_URL (OAuth 登入完成後導回的前端網址)、GOOGLE_*／GITHUB_* (OAuth 用戶端憑證)。 */
export interface Env {
  DB: D1Database
  PROVISIONING_SECRET: string
  ALLOWED_ORIGINS: string
  FRONTEND_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
}
