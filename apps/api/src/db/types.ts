import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { schema } from './schema'

/**
 * 路由層看到的 db 型別：不綁定特定 driver。D1（正式環境，非同步）與
 * better-sqlite3（測試，同步）都是 `drizzle-orm/sqlite-core` 的
 * `BaseSQLiteDatabase`，差別只在 `TResultKind`。路由程式碼一律 `await`
 * 查詢結果，因此可以共用同一份，不需要知道底層是哪個 driver。
 *
 * 這個檔案刻意不 import `./client`（D1 專用）——避免測試檔案透過
 * `app.ts` 的型別鏈間接需要 `@cloudflare/workers-types` 的環境變數型別
 * （那隻在 tsconfig.worker.json 才有，見 apps/api/README.md 的說明）。
 */
export type AnyDb = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>
