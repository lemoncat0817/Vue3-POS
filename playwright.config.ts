import { defineConfig, devices } from '@playwright/test'

/**
 * P0 階段僅接上工具鏈本身並提供一條可執行的示範案例（登入流程）。
 * §13 規劃的六條主流程（混合支付、離線結帳、發票補開…）都依賴 P2～P6
 * 才會存在的功能，此時尚無法撰寫，留待對應階段補上。
 *
 * P3：apps/pos 開始真的呼叫 apps/api（見 e2e/catalog-sync.spec.ts），
 * 所以 webServer 除了原本的 vite preview，還要一併帶起 wrangler dev
 * （本機 D1，需要先跑過 apps/api 的 db:migrate:local／db:seed:local，見
 * apps/api/README.md），讓 `pnpm run test:e2e` 本身就是自足、可重現的，
 * 不需要事先手動另開一個終端機跑後端。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // vite.config.ts 設定了 base: '/Vue3-POS/'（GitHub Pages 部署路徑），
    // preview 伺服器的實際頁面也掛在這個子路徑下。
    baseURL: 'http://localhost:4173/Vue3-POS/',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
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
