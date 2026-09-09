import { expect, test } from '@playwright/test'

// 驗證應用初始化時向 API 取得菜單資料並供點餐流程使用。
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

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  const row = page.getByTestId('cart-row').first()
  await expect(row).toContainText('80')
})
