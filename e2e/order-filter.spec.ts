import { expect, test } from '@playwright/test'

// 驗證訂單篩選輸入包含正規表示式特殊字元（如左括號）時不會崩潰且篩選正確。
test('訂單編號篩選輸入正規表示式特殊字元不會讓頁面出錯，且篩選結果正確', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
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
  const orderIdInput = page.getByPlaceholder('輸入訂單編號')
  const rows = page.getByTestId('order-row')
  await expect(rows).toHaveCount(5)

  await orderIdInput.fill('(')

  await expect(page.getByText('目前無訂單')).toBeVisible()
  await expect(page.getByText('總共有')).toBeVisible()

  await orderIdInput.fill('202406')
  await expect(rows).toHaveCount(4)

  await page.getByRole('button', { name: '重置篩選' }).click()
  await expect(rows).toHaveCount(5)
})
