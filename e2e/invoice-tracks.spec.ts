import { expect, test } from '@playwright/test'

// 驗證電子發票字軌新增、自動切換啟用與模擬上傳流程。
test('新增電子發票字軌後自動啟用，送單用新字軌配號；模擬上傳會更新發票狀態', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '電子發票字軌', exact: true }).click()

  const trackCode = 'Z' + String.fromCharCode(65 + (Date.now() % 26))
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/invoices/tracks') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '新增字軌（換下一期）', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增字軌' })
  await addDialog.getByLabel(/字軌代號/).fill(trackCode)
  await addDialog.getByLabel('期別說明').fill(`P23測試期別-${Date.now()}`)
  await addDialog.getByLabel('起始號碼').fill('1')
  await addDialog.getByLabel('結束號碼').fill('1000')
  await addDialog.getByRole('button', { name: '新增並啟用', exact: true }).click()
  const trackBody = (await (await createResponse).json()) as { id: string; trackCode: string; isActive: boolean }
  expect(trackBody).toMatchObject({ trackCode, isActive: true })
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
  // 結合字軌代號與啟用中狀態篩選，避免重複代號的歷史已停用列干擾。
  const row = page.getByRole('row').filter({ hasText: trackCode }).filter({ hasText: '啟用中' })
  await expect(row).toContainText('啟用中')

  await page.getByRole('button', { name: '點餐', exact: true }).click()
  const createOrderResponse = page.waitForResponse(
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
  const orderBody = (await (await createOrderResponse).json()) as { invoiceNumber: string; invoiceStatus: string }
  expect(orderBody.invoiceNumber.startsWith(trackCode)).toBe(true)
  expect(orderBody.invoiceStatus).toBe('issued')

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '電子發票字軌', exact: true }).click()
  const submitResponse = page.waitForResponse(
    (res) => res.url().includes('/api/invoices/submit') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '模擬上傳未上傳的發票', exact: true }).click()
  const submitBody = (await (await submitResponse).json()) as { submittedCount: number }
  expect(submitBody.submittedCount).toBeGreaterThan(0)
  await expect(page.getByTestId('toast-message')).toContainText('已模擬上傳')
})
