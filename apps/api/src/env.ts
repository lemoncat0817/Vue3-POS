/** Worker 的 binding／secret／設定值環境變數（wrangler.jsonc 對應這裡
 *  的 DB 與 ALLOWED_ORIGINS；PROVISIONING_SECRET 用 `wrangler secret
 *  put PROVISIONING_SECRET` 設定，不寫進 wrangler.jsonc）。裝置憑證
 *  本身（P4）已經改成存在 devices 資料表，不再需要獨立的
 *  DEVICE_TOKEN 環境變數。
 *
 *  ALLOWED_ORIGINS（P21：規劃書 §10 P21「API 安全加固」）：CORS
 *  白名單，逗號分隔的來源清單（見 app.ts 的說明）——這不是密鑰，寫
 *  在 wrangler.jsonc 的 vars 就好，不需要 wrangler secret。 */
export interface Env {
  DB: D1Database
  PROVISIONING_SECRET: string
  ALLOWED_ORIGINS: string
}
