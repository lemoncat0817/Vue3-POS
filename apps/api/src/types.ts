import type { AnyDb } from './db/types'

/** Hono 的 context 變數：路由透過 `c.get('db')` 取得 Drizzle 實例。
 *  獨立成自己的檔案，讓 app.ts 與各個 src/routes/*.ts 都能 import，
 *  不會互相循環依賴。 */
export type AppEnv = {
  Variables: {
    db: AnyDb
    /**
     * 目前僅有的裝置層級憑證檢查（見 src/middleware/require-device-token.ts）
     * ——單一固定字串比對，是 P4 完整身分系統（裝置憑證＋操作員登入）
     * 之前的最小可行防護，先讓「有動作會被拒絕」這件事在 P2 就是真的。
     */
    deviceToken: string
  }
}
