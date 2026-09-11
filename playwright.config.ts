import { defineConfig, devices } from '@playwright/test'
import { authFile } from './e2e/auth-file'

// E2E 測試設定：自動啟動前端 preview 與後端 dev server，確保測試獨立可重現。
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // 對齊 Vite 的 base 設定（預設 '/'，可由 VITE_BASE_PATH 動態指定）。
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ??
      `http://localhost:4173${process.env.VITE_BASE_PATH || '/'}`,
    trace: 'on-first-retry'
  },
  // setup 專案先核發一組裝置憑證存進 storageState，其餘專案都依賴它——
  // 裝置憑證不再是 build-time 塞進前端的環境變數（見 global.setup.ts），
  // 每個測試專案都要先配對過裝置才能通過 /login 頁的裝置憑證檢查。
  // shift.spec.ts 另外獨立為依賴專案，避免平行送單干擾全域班別的收班現金帳差計算。
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      testIgnore: /shift\.spec\.ts/,
      dependencies: ['setup']
    },
    {
      name: 'chromium-shift',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      testMatch: /shift\.spec\.ts/,
      dependencies: ['chromium']
    }
  ],
  webServer: [
    {
      command: 'pnpm --filter @pos/app run preview -- --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: 'pnpm --filter @pos/api run dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  ]
})
