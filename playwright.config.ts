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
  // shift.spec.ts 斷言的是一個絕對數字（收班時算出的 expectedCash），
  // 前提是「這個班別開帳到收班之間，D1 的 orders 表裡不會多出計畫外的
  // 現金訂單」——但 sumCashSales（見 apps/api/src/routes/shifts.ts）
  // 掃的是整張 orders 表、用時間區間篩選，不是只看這個班別自己送出的
  // 訂單。fullyParallel 情境下，只要任何一條「也會用現金送單」的測試
  // 剛好在這個時間窗內跑，就會把不相干的金額算進來，讓斷言隨機失敗
  // ——這不是這個測試本身的邏輯錯，是「單店單機、全域只有一個班別」
  // 這個既有簡化（見 shifts.spec.ts 的說明）在平行測試環境下的必然
  // 副作用，隨著送單類測試越來越多，撞期機率只會越來越高。用 Playwright
  // 的 project dependencies 把 shift.spec.ts 獨立成第二個 project，
  // 等第一個 project（其他所有會送單的測試）全部跑完才開始，讓這個
  // 班別在整個測試過程中獨佔 orders 表，不需要放寬斷言本身（放寬成
  // 「至少多少」會讓這個測試沒辦法真的驗證帳差算得精不精準）。
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
