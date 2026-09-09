import { expect, test } from '@playwright/test'

// 驗證本機掛單、清空購物車、取單還原品項與購物車覆蓋確認邏輯。
test('掛單後購物車清空，取單能把品項與備註原封不動地拿回來', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await expect(page.getByText('目前無待付款的飲品')).toHaveCount(0)

  await page.getByTestId('parked-orders-button').click()
  await page.getByPlaceholder('備註（選填，例如：3號桌、王小姐）').fill('3號桌')
  await page.getByTestId('park-current-order').click()
  await expect(page.getByTestId('toast-message')).toHaveText('已掛單')

  await expect(page.getByTestId('parked-order-row')).toHaveCount(1)
  await expect(page.getByTestId('parked-order-row')).toContainText('3號桌')
  await expect(page.getByTestId('parked-orders-button')).toContainText('（1）')
  await page.getByRole('button', { name: '關閉' }).click()
  await expect(page.getByText('目前無待付款的飲品')).toBeVisible()

  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('parked-order-row').getByRole('button', { name: '取單', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('已取單')
  await expect(page.getByTestId('cart-row')).toContainText('楊枝甘露2.0')
  await expect(page.getByText('目前無待付款的飲品')).toHaveCount(0)

  await page.getByTestId('parked-orders-button').click()
  await expect(page.getByText('目前沒有掛單')).toBeVisible()
})

test('取單時目前購物車還有品項，需要確認才會覆蓋', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('park-current-order').click()
  await expect(page.getByTestId('toast-message')).toHaveText('已掛單')
  await page.getByRole('button', { name: '關閉' }).click()

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('parked-order-row').getByRole('button', { name: '取單', exact: true }).click()
  await expect(page.getByText('目前待付款清單還有品項，取單會覆蓋目前清單，是否繼續？')).toBeVisible()
  await page.getByRole('button', { name: '繼續取單' }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('已取單')
})
