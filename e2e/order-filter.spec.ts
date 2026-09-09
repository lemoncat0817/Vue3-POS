import { expect, test } from '@playwright/test'

// 驗證訂單頁的關鍵字／期間篩選：特殊字元不會讓頁面出錯，期間篩選能正確排除黃金資料集裡的舊訂單。
test('訂單編號關鍵字篩選輸入正規表示式特殊字元不會讓頁面出錯，且篩選結果正確', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('薯條', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const keywordInput = page.getByPlaceholder('輸入訂單編號')
  const rows = page.getByTestId('order-row')
  await expect(rows).toHaveCount(5)

  await keywordInput.fill('(')
  await expect(page.getByText('目前無訂單')).toBeVisible()
  await expect(page.getByText('總共有')).toBeVisible()

  await keywordInput.fill('202406')
  await expect(rows).toHaveCount(4)

  await page.getByRole('button', { name: '重置篩選' }).click()
  await expect(rows).toHaveCount(5)
})

test('訂單期間篩選能排除黃金資料集裡的舊訂單，只留下今天新建立的訂單', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('薯條', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const rows = page.getByTestId('order-row')
  await expect(rows).toHaveCount(5)

  const today = new Date().toISOString().slice(0, 10)
  await page.getByLabel('起始日期').fill(today)
  await expect(rows).toHaveCount(1)

  await page.getByRole('button', { name: '重置篩選' }).click()
  await expect(rows).toHaveCount(5)
})

test('通路與付款方式篩選可個別套用與移除', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const rows = page.getByTestId('order-row')
  await expect(rows).toHaveCount(4)

  await page.getByLabel('通路').selectOption('內用')
  await expect(rows).toHaveCount(0)
  await expect(page.getByText('通路：內用')).toBeVisible()

  await page.getByText('通路：內用').click()
  await expect(rows).toHaveCount(4)

  await page.getByLabel('付款方式').selectOption('現金')
  await expect(rows).toHaveCount(2)
})
