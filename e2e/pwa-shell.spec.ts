import { expect, test } from '@playwright/test'

// 驗證 Service Worker 預先快取應用程式外殼，使離線重新整理仍能載入頁面。
test('service worker 預先快取應用程式外殼，離線重新整理仍能開啟登入頁', async ({ page, context }) => {
  await page.goto('login')
  await expect(page.getByPlaceholder('請輸入帳號')).toBeVisible()

  // 等候 Service Worker 就緒再切斷連線，確保快取資源已建置完成。
  await page.evaluate(() => navigator.serviceWorker.ready)

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByPlaceholder('請輸入帳號')).toBeVisible()
  await expect(page.getByPlaceholder('請輸入 PIN')).toBeVisible()
})
