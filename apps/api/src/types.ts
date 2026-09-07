import type { AnyDb } from './db/types'

/** Hono 的 context 變數：路由透過 `c.get('db')` 取得 Drizzle 實例。
 *  獨立成自己的檔案，讓 app.ts 與各個 src/routes/*.ts 都能 import，
 *  不會互相循環依賴。 */
export type AppEnv = {
  Variables: {
    db: AnyDb
  }
}
