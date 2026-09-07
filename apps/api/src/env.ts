/** Worker 的 binding／secret 環境變數（wrangler.jsonc 對應這裡的 DB；
 *  PROVISIONING_SECRET 用 `wrangler secret put PROVISIONING_SECRET`
 *  設定，不寫進 wrangler.jsonc）。裝置憑證本身（P4）已經改成存在
 *  devices 資料表，不再需要獨立的 DEVICE_TOKEN 環境變數。 */
export interface Env {
  DB: D1Database
  PROVISIONING_SECRET: string
}
