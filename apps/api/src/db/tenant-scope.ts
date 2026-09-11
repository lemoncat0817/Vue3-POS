import { eq, isNull, type SQL } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'

/**
 * 租戶過濾條件。tenantId 為 null 代表尚未接上 OAuth 的過渡期資料（見
 * middleware/require-device-token.ts），這時比對「tenantId 欄位也是 null」
 * 而不是整表不過濾——即使在接 OAuth 之前，不同裝置只要各自的 tenantId
 * 不同，資料就已經互相隔離，不用等 Phase 3 才有保護效果。
 */
export function tenantFilter(column: SQLiteColumn, tenantId: string | null): SQL {
  return tenantId === null ? isNull(column) : eq(column, tenantId)
}
