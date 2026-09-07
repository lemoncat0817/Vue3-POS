import { expect, test } from '@playwright/test'

/**
 * P3（規劃書 §14）：PWA 外殼。離線送單（見 e2e/offline-sync.spec.ts）
 * 有意義的前提是應用程式本身在完全沒有網路時也載得起來，不只是「已經
 * 開著的分頁」才能離線運作——這裡驗證的是「重新整理」這個更嚴格的
 * 情境：service worker 的預先快取（見 vite.config.ts 的 VitePWA 設定）
 * 要能在瀏覽器完全連不上任何伺服器時，仍然把整個應用程式外殼生出來。
 *
 * 只有 `vite build` 才會產生 service worker（generateSW 模式），
 * playwright.config.ts 的 webServer 用的正是 build 後的 vite preview，
 * 不是 vite dev，這裡才測得到。
 */
test('service worker 預先快取應用程式外殼，離線重新整理仍能開啟登入頁', async ({ page, context }) => {
  await page.goto('login')
  await expect(page.getByPlaceholder('請輸入帳號')).toBeVisible()

  // 等 service worker 真的完成註冊＋啟用，不然離線測試會因為快取根本
  // 還沒建好而失敗，跟「PWA 快取本身有沒有用」是兩件事。
  await page.evaluate(() => navigator.serviceWorker.ready)

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByPlaceholder('請輸入帳號')).toBeVisible()
  await expect(page.getByPlaceholder('請輸入 PIN')).toBeVisible()
})
