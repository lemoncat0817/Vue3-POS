import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { schema } from './schema'

export type AnyDb = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>
