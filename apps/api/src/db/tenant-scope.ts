import { eq, isNull, type SQL } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'

// tenantId 為 null 時比對 isNull，避免過渡期資料跨裝置洩漏
export function tenantFilter(column: SQLiteColumn, tenantId: string | null): SQL {
  return tenantId === null ? isNull(column) : eq(column, tenantId)
}
