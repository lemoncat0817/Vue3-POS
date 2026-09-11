import { expect, test } from '@playwright/test'

// 驗證數據分析頁報表 API 請求、日期區間參數切換與圖表渲染。
test('數據分析頁會向伺服端要報表資料，切換日期會重新查詢', async ({ page }) => {
  const firstReportResponse = page.waitForResponse(
    (res) => res.url().includes('/api/reports/sales') && res.request().method() === 'GET'
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
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  expect(from).toMatch(/^\d{8}$/)
  expect(from).toBe(to)

  // ECharts 會為多張圖各掛 canvas，不能用 toBeVisible() 的 strict 單元素斷言。
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByText('熱銷品項排行榜', { exact: false })).toBeVisible()
  await expect(page.getByText('分類別銷售佔比', { exact: false })).toBeVisible()
  await expect(page.getByText('加購選配榜單', { exact: false })).toBeVisible()
  await expect(page.getByText('多元支付通路結構', { exact: false })).toBeVisible()

  // 切換為跨日區間，確保填寫順序維持 from <= to。
  const rangeReportResponse = page.waitForResponse(
    (res) => res.url().includes('/api/reports/sales') && res.request().method() === 'GET'
  )
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await page.getByLabel('開始時間').fill(`${yearMonth}-01`)
  await page.getByLabel('結束時間').fill(`${yearMonth}-28`)

  const rangeRes = await rangeReportResponse
  expect(rangeRes.status()).toBe(200)
  const rangeUrl = new URL(rangeRes.url())
  expect(rangeUrl.searchParams.get('from')).not.toBe(rangeUrl.searchParams.get('to'))
})
