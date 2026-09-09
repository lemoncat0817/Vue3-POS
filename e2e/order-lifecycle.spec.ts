import { expect, test } from '@playwright/test'

// 驗證訂單狀態變更（取消／作廢）與刪除操作向伺服端發送請求及畫面更新。
test('編輯訂單狀態與刪除訂單會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
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
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/status`) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
  )
  await row.getByRole('button', { name: '編輯訂單狀態' }).click()
  await page.getByRole('button', { name: '已取消', exact: true }).click()
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('1234')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()
  await page.getByRole('textbox', { name: '原因' }).fill('客人臨時取消')
  await page.getByRole('button', { name: '確認作廢' }).click()
  const statusBody = (await (await statusResponse).json()) as { orderStatus: string; voidReason: string }
  expect(statusBody.orderStatus).toBe('已取消')
  expect(statusBody.voidReason).toBe('客人臨時取消')
  await expect(page.getByTestId('toast-message')).toHaveText('訂單狀態已設定為已取消')
  await expect(row).toContainText('已取消')

  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/orders/${createBody.orderId}`) && res.request().method() === 'DELETE',
  )
  await row.getByRole('button', { name: '刪除訂單' }).click()
  await page.getByRole('button', { name: '確定' }).click()
  const deleteRes = await deleteResponse
  expect(deleteRes.status()).toBe(204)
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByTestId('order-row').filter({ hasText: createBody.orderId })).toHaveCount(0)
})
