import { expect, test } from '@playwright/test'

// 驗證點餐頁發票載具設定、伺服端發票號碼核發與格式校驗。
test('選擇手機條碼載具後送單，伺服端記錄的載具與發票號碼都正確，畫面上看得到', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await expect(page.getByTestId('invoice-carrier-button')).toHaveText('載具')

  await page.getByTestId('invoice-carrier-button').click()
  await page.getByRole('button', { name: '手機條碼', exact: true }).click()
  await page.getByPlaceholder('/ABC1234').fill('bad-format')
  await expect(page.getByTestId('confirm-invoice-carrier')).toBeDisabled()

  await page.getByPlaceholder('/ABC1234').fill('/ABC1234')
  await page.getByTestId('confirm-invoice-carrier').click()
  await expect(page.getByTestId('invoice-carrier-button')).toHaveText('載具：手機')

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
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
  const createBody = (await (await createResponse).json()) as {
    orderId: string
    invoiceNumber: string
    invoiceCarrier: { type: string; value?: string }
  }
  expect(createBody.invoiceNumber).toMatch(/^[A-Z]{2}\d{8}$/)
  expect(createBody.invoiceCarrier).toEqual({ type: '手機條碼', value: '/ABC1234' })

  await expect(page.getByTestId('invoice-carrier-button')).toHaveText('載具')

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()
  await row.locator('button[aria-label="展開明細"]').click()
  await expect(page.getByText(`發票號碼：${createBody.invoiceNumber}`)).toBeVisible()
  await expect(page.getByText('手機條碼 /ABC1234')).toBeVisible()
})
