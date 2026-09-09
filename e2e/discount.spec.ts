import { expect, test } from '@playwright/test'

// 驗證點餐環保折扣套用與取消之計算正確性。
test('環保折扣：勾選品項後套用，小計正確扣減，取消後恢復原價', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  const row = page.getByTestId('cart-row').first()
  await expect(row).toContainText('80')

  await row.locator('input[type="checkbox"]').click()
  await page.getByRole('button', { name: '環保折扣' }).click()
  await expect(row.locator('td').nth(9)).toContainText('75')

  await page.getByRole('button', { name: '環保折扣' }).click()
  await expect(row.locator('td').nth(9)).toContainText('80')
})
