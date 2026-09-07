import { expect, test } from '@playwright/test'

/**
 * P3 迴歸驗證：App.vue 掛載時真的會呼叫 apps/api 的 GET /api/catalog
 * （見 App.vue 與 stores/drink.ts 的 hydrateCatalogFromServer 說明），
 * 不是只在單元測試裡 mock 過。這裡需要本機真的跑一份 wrangler dev
 * （見 apps/api/README.md），指向 http://localhost:8787。
 */
test('點餐頁掛載時會向 apps/api 要一份菜單，且點餐流程用得到這份資料', async ({ page }) => {
  const catalogResponse = page.waitForResponse(
    (res) => res.url().includes('/api/catalog') && res.request().method() === 'GET',
  )

  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const res = await catalogResponse
  expect(res.status()).toBe(200)
  const body = (await res.json()) as { groups: unknown[]; addOns: unknown[] }
  expect(body.groups.length).toBeGreaterThan(0)

  // 同步後的資料要能實際用在點餐流程上（不是只有 fetch 成功但沒接上畫面）。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  // P8：待付款清單改用純 HTML table，取代 el-table（見 views/home/
  // index.vue 的說明），row 用 data-testid="cart-row" 定位。
  const row = page.getByTestId('cart-row').first()
  await expect(row).toContainText('80')
})
