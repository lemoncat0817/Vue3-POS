/** Worker 環境變數：DB (D1)、PROVISIONING_SECRET (裝置核發密鑰)、ALLOWED_ORIGINS (CORS 白名單)。 */
export interface Env {
  DB: D1Database
  PROVISIONING_SECRET: string
  ALLOWED_ORIGINS: string
}
