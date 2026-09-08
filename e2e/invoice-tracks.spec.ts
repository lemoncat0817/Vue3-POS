import { expect, test } from '@playwright/test'

/**
 * P23 迴歸驗證（規劃書 §10 P23「電子發票平台串接」）：
 *
 * - 後台可以新增電子發票字軌，新增會自動停用舊字軌並啟用新字軌。
 * - 新字軌啟用後，送單開立的發票號碼會用新字軌的代號。
 * - 「模擬上傳未上傳的發票」會把已開立的發票標成已上傳（見
 *   apps/api/src/routes/invoices.ts 的 submitInvoices，沒有真正介接
 *   財政部平台，這裡驗證的是模擬流程本身）。
 *
 * 這裡用真正的 wrangler dev + 本機 D1 驗證。
 */
test('新增電子發票字軌後自動啟用，送單用新字軌配號；模擬上傳會更新發票狀態', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '電子發票字軌', exact: true }).click()

  // 新增一組獨一無二的字軌代號（用時間戳記轉成兩碼英文字母，避免跟
  // 種子資料或其他測試留下的字軌代號衝突）。
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
  // 表格上這一列應該顯示「啟用中」。
  const row = page.getByRole('row').filter({ hasText: trackCode })
  await expect(row).toContainText('啟用中')

  // 點餐、送單，發票號碼應該用新字軌開頭。
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

  // 模擬上傳：這張剛開立的發票應該被標成已上傳。
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
