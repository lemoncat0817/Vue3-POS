import { defineConfig } from 'drizzle-kit'

// out 指向 ./migrations 以對齊 wrangler d1 migrations apply 預設路徑，共用 migration 檔。
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations'
})
