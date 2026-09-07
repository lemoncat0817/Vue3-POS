import { expect, test } from '@playwright/test'

/**
 * P0 示範案例：驗證 Playwright 工具鏈本身能跑起來，並涵蓋登入這條現行
 * 就存在、不依賴任何 P1 之後才有的後端或功能的路徑。
 */
test('店長帳號可以登入並看到點餐頁面', async ({ page }) => {
  await page.goto('login')

  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()

  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByText('機台編號')).toBeVisible()
})

test('帳號密碼錯誤時停留在登入頁並顯示錯誤訊息', async ({ page }) => {
  await page.goto('login')

  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('9999')
  await page.getByRole('button', { name: '登入' }).click()

  await expect(page.getByText('帳號或是 PIN 有誤')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})
