import { expect, test } from '@playwright/test'

/**
 * P1 迴歸驗證：確認 home/index.vue 六個折扣函式改用
 * packages/pos-domain 的 priceLine()／toggle 函式後，實際畫面上的折扣
 * 計算仍然正確（見 pricing.ts 的說明）。
 */
test('環保折扣：勾選品項後套用，小計正確扣減，取消後恢復原價', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 選「季節限定」系列 →「楊枝甘露2.0」（priceL 80，customized: 'none'，
  // 不需要選糖冰或容器大小）→ 數量設為 1 → 新增到待付款清單。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  const row = page.locator('.el-table__row').first()
  await expect(row).toContainText('80')

  // 勾選該列，套用環保折扣（每杯扣 5 元）。
  await row.locator('.el-checkbox__inner').click()
  await page.getByRole('button', { name: '環保折扣' }).click()
  await expect(row.locator('td').nth(9)).toContainText('75')

  // 再點一次取消，應恢復原價 80。
  await page.getByRole('button', { name: '環保折扣' }).click()
  await expect(row.locator('td').nth(9)).toContainText('80')
})
