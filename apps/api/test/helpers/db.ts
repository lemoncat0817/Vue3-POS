import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { schema } from '../../src/db/schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '../../migrations')

// 測試用記憶體 SQLite 資料庫，套用 migrations 遷移檔案
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
