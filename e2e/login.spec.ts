import { expect, test } from '@playwright/test'

// 登入功能 E2E 測試。
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

  await expect(page.getByTestId('toast-message')).toHaveText(/帳號或是 PIN 有誤/)
  await expect(page).toHaveURL(/\/login$/)
})
