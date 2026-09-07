import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { schema } from '../../src/db/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '../../migrations')

/**
 * 測試用的 db：用 better-sqlite3 建立一個記憶體內的 SQLite 資料庫，套用
 * 與正式環境相同的 drizzle-kit 產生的 migration SQL（drizzle/*.sql），
 * 確保測試跑的 schema 與部署到 D1 的 schema 是同一份，不是另外手動
 * 維護的一份副本。
 *
 * D1 底層就是 SQLite，better-sqlite3 的行為與 D1 高度一致，足以驗證
 * 路由與查詢邏輯；但兩者並非百分之百等價（例如交易語意、部分限制不同），
 * 部署前仍建議用 `wrangler dev` 或 `wrangler d1 execute --local` 手動驗證
 * 一次（見 apps/api/README.md）。
 */
export function createTestDb() {
  const sqlite = new Database(':memory:')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    sqlite.exec(readFileSync(join(migrationsDir, file), 'utf-8'))
  }
  return drizzle(sqlite, { schema })
}

export type TestDb = ReturnType<typeof createTestDb>
