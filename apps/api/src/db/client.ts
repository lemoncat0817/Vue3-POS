import { drizzle } from 'drizzle-orm/d1'
import { schema } from './schema'

/** 用 Cloudflare 的 D1 binding 建立 Drizzle 實例。 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

/** Worker 端使用的 db 型別（D1 驅動）。測試環境則使用 better-sqlite3。 */
export type Db = ReturnType<typeof createDb>
