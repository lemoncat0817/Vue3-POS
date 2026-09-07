import { defineConfig } from 'drizzle-kit'

// out 指向 ./migrations（而非 drizzle-kit 慣用的 ./drizzle）是刻意的：
// wrangler 的 `d1 migrations apply` 預設會讀取 ./migrations 底下依序
// 編號的 SQL 檔案直接套用，drizzle-kit 產生的檔名格式（0000_xxx.sql）
// 剛好相容，兩邊共用同一份 migration，不需要另外轉換。
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
})
