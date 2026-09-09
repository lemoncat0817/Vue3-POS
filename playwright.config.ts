import { defineConfig, devices } from '@playwright/test'

// E2E 測試設定：自動啟動前端 preview 與後端 dev server，確保測試獨立可重現。
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // 對齊 Vite 的 base 設定（預設 '/'，可由 VITE_BASE_PATH 動態指定）。
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:4173${process.env.VITE_BASE_PATH || '/'}`,
    trace: 'on-first-retry',
  },
  // shift.spec.ts 獨立為依賴專案，避免平行送單干擾全域班別的收班現金帳差計算。
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /shift\.spec\.ts/ },
    { name: 'chromium-shift', use: { ...devices['Desktop Chrome'] }, testMatch: /shift\.spec\.ts/, dependencies: ['chromium'] },
  ],
  webServer: [
    {
      command: 'pnpm --filter @pos/app run preview -- --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @pos/api run dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
