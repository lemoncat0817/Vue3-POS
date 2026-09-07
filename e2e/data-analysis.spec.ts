import { expect, test } from '@playwright/test'

/**
 * P7 迴歸驗證（D-15）：數據分析頁原本完全對本機 Pinia 狀態做統計，從沒
 * 打過任何 API。現在改成呼叫 GET /api/reports/sales（見
 * views/dataAnalysis/index.vue、api/reports.ts 的說明），這裡驗證真的
 * 對 wrangler dev + 本機 D1 送出這個請求、切換分頁與日期區間會帶對應
 * 的查詢參數，且畫面真的用得到回應資料（圖表渲染出對應的 canvas）。
 */
test('數據分析頁會向伺服端要報表資料，切換分頁與日期會重新查詢', async ({ page }) => {
  const firstReportResponse = page.waitForResponse(
    (res) => res.url().includes('/api/reports/sales') && res.request().method() === 'GET',
  )

  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('數據分析', { exact: true }).click()
  await expect(page).toHaveURL(/\/dataAnalysis$/)

  const firstRes = await firstReportResponse
  expect(firstRes.status()).toBe(200)
  const url = new URL(firstRes.url())
  // 預設時間區間是「今天到今天」，from／to 應該是同一個 YYYYMMDD。
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  expect(from).toMatch(/^\d{8}$/)
  expect(from).toBe(to)

  // 一開始（單日）看的是「營業額」分頁，應該渲染出折線圖的 canvas。
  await expect(page.locator('canvas')).toBeVisible()

  // 切到「熱門飲料」分頁——同一份報表資料已經回來，不需要重新打 API，
  // 但畫面要重新渲染出對應的圖表。
  await page.getByText('熱門飲料', { exact: true }).click()
  await expect(page.locator('canvas')).toBeVisible()

  // 切換到跨日期區間會帶新的 from／to 重新呼叫 API。el-date-picker 的
  // daterange 一次顯示左右兩個月曆面板（見面板的 ARIA 快照），左邊選開始
  // 日、右邊選結束日即完成選取，不像單日 picker 有「確定」按鈕。
  const rangeReportResponse = page.waitForResponse(
    (res) => res.url().includes('/api/reports/sales') && res.request().method() === 'GET',
  )
  await page.getByPlaceholder('開始時間').click()
  const monthPanels = page.getByRole('grid')
  // 排除 .next-month／.prev-month（月曆面板前後補位、屬於相鄰月份的
  // 日期格），避免同一個面板裡出現兩個文字一樣的 "10"。
  const availableDay = (panel: typeof monthPanels, day: string) =>
    panel.locator('td.available:not(.next-month):not(.prev-month)').filter({ hasText: new RegExp(`^${day}$`) })
  await availableDay(monthPanels.nth(0), '10').click()
  await availableDay(monthPanels.nth(1), '20').click()

  const rangeRes = await rangeReportResponse
  expect(rangeRes.status()).toBe(200)
  const rangeUrl = new URL(rangeRes.url())
  expect(rangeUrl.searchParams.get('from')).not.toBe(rangeUrl.searchParams.get('to'))
})
