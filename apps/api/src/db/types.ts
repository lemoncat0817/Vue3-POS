import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { schema } from './schema'

/**
 * 路由層使用的抽象 db 型別。相容正式環境 D1（async）與測試環境 better-sqlite3（sync），
 * 避免測試型別鏈依賴 @cloudflare/workers-types。
 */
export type AnyDb = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>
