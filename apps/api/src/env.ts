/** Worker 的 binding／secret 環境變數（wrangler.jsonc 對應這裡的 DB；
 *  DEVICE_TOKEN／PROVISIONING_SECRET 用 `wrangler secret put` 設定，
 *  不寫進 wrangler.jsonc）。 */
export interface Env {
  DB: D1Database
  DEVICE_TOKEN: string
  PROVISIONING_SECRET: string
}
