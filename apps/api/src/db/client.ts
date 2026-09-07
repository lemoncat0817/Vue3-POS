import { drizzle } from 'drizzle-orm/d1'
import { schema } from './schema'

/** 用 Cloudflare 的 D1 binding 建立 Drizzle 實例。 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

/** Worker 端實際使用的 db 型別。測試改用 better-sqlite3（見 test/helpers/db.ts），
 *  兩者對 src/app.ts 的路由來說是同一種 async 查詢介面（drizzle-orm/sqlite-core
 *  的 BaseSQLiteDatabase），路由程式碼本身不需要知道底層是哪個 driver。 */
export type Db = ReturnType<typeof createDb>
