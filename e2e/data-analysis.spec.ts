import { expect, test } from '@playwright/test'

/**
 * P7 迴歸驗證（D-15）：數據分析頁原本完全對本機 Pinia 狀態做統計，從沒
 * 打過任何 API。現在改成呼叫 GET /api/reports/sales（見
 * views/dataAnalysis/index.vue、api/reports.ts 的說明），這裡驗證真的
 * 對 wrangler dev + 本機 D1 送出這個請求、切換日期區間會帶對應的查詢
 * 參數，且畫面真的用得到回應資料（圖表渲染出對應的 canvas）。
 *
 * UI-7（規劃書 §5.3「數據分析」）：四張圖表原本切成四個頁籤、一次只
 * 顯示一種，改成 12 欄網格的單頁儀表板後不用再切頁籤——原本各排行榜
 * 搭配的圓餅圖也拿掉了，只留旁邊本來就有的排行清單，所以整頁固定只
 * 有「營業額走勢」這一張 echarts 折線圖、一個 canvas。
 */
test('數據分析頁會向伺服端要報表資料，切換日期會重新查詢', async ({ page }) => {
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

  // 營業額走勢圖表應該渲染出折線圖的 canvas，熱門飲品／配料／支付
  // 通路的排行清單（不再是圖表）同一時間都在同一頁上看得到。
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText('熱門飲品排行榜', { exact: false })).toBeVisible()
  await expect(page.getByText('加料選配榜單', { exact: false })).toBeVisible()
  await expect(page.getByText('多元支付通路結構', { exact: true })).toBeVisible()

  // 切換到跨日期區間會帶新的 from／to 重新呼叫 API。原生
  // <input type="date"> 直接 fill 一個 'YYYY-MM-DD' 字串即可，不像
  // el-date-picker 需要點開月曆面板逐格點選。先改開始時間（改成當月 1
  // 號，必定 <= 今天）再改結束時間（改成當月 28 號，必定 >= 開始時間），
  // 確保兩次 fill 之間的中繼狀態也一直是合法的 from <= to，不受「今天」
  // 實際是幾號影響。
  const rangeReportResponse = page.waitForResponse(
    (res) => res.url().includes('/api/reports/sales') && res.request().method() === 'GET',
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
