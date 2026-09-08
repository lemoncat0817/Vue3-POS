import { expect, test } from '@playwright/test'

/**
 * P16 迴歸驗證（規劃書 §10 P0「周邊模擬」）：
 *
 * - 開收銀機：沒有對應交易的開錢箱動作現在需要填寫理由才能送出，
 *   不再是彈一句話就結束的假操作（見 views/home/index.vue 的
 *   openCashier 說明）。
 * - 收據預覽：訂單列表可以看到收據內容（品項、金額、發票號碼等），
 *   這裡不點「列印」（會叫出瀏覽器系統列印對話框，headless 環境下
 *   行為不可預期，不是這個測試該驗證的範圍），只驗證內容正確渲染。
 */
test('開收銀機沒填理由無法送出，填了理由後顯示成功訊息', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '開收銀機', exact: true }).click()
  await expect(page.getByRole('button', { name: '開啟', exact: true })).toBeDisabled()

  await page.getByRole('textbox', { name: '理由' }).fill('協助客人換零錢')
  await page.getByRole('button', { name: '開啟', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('收銀機已開啟')
})

test('訂單列表可以看到收據預覽，內容包含品項、金額與發票號碼', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

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
  const createBody = (await (await createResponse).json()) as { orderId: string; invoiceNumber: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: '收據', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: '收據預覽' })).toBeVisible()
  await expect(dialog.getByText(createBody.orderId)).toBeVisible()
  await expect(dialog.getByText('楊枝甘露2.0（L）')).toBeVisible()
  await expect(dialog.getByText(createBody.invoiceNumber)).toBeVisible()
  await expect(dialog.getByTestId('print-receipt')).toBeVisible()
})
