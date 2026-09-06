import { defineConfig, devices } from '@playwright/test'

/**
 * P0 階段僅接上工具鏈本身並提供一條可執行的示範案例（登入流程）。
 * §13 規劃的六條主流程（混合支付、離線結帳、發票補開…）都依賴 P2～P6
 * 才會存在的功能，此時尚無法撰寫，留待對應階段補上。
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
  webServer: {
    command: 'pnpm --filter @pos/app run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
