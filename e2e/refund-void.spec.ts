import { expect, test } from '@playwright/test'

// 驗證訂單作廢原因必填與伺服端紀錄，以及部分退款金額上限防護。
test('作廢訂單需要填寫原因，畫面與伺服端都記錄下這個原因', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('雞塊六入', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: '作廢訂單' }).click()
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('1234')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()

  await expect(page.getByRole('button', { name: '確認作廢' })).toBeDisabled()

  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/status`) &&
      res.request().method() === 'PATCH' &&
      res.ok()
  )
  await page.getByRole('textbox', { name: '原因' }).fill('客人臨時取消訂單')
  await page.getByRole('button', { name: '確認作廢' }).click()
  const statusBody = (await (await statusResponse).json()) as {
    orderStatus: string
    voidReason: string
    voidedBy: string
  }
  expect(statusBody.orderStatus).toBe('已取消')
  expect(statusBody.voidReason).toBe('客人臨時取消訂單')
  expect(statusBody.voidedBy).toContain('Lemon')

  await expect(page.getByTestId('toast-message')).toHaveText('訂單已作廢')
  await expect(row).toContainText('已取消')

  await row.locator('button[aria-label="展開明細"]').click()
  await expect(page.getByText('作廢原因：客人臨時取消訂單')).toBeVisible()
})

test('部分退款：訂單維持已完成，畫面顯示已退款金額，超過可退額度時伺服端拒絕', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('雞塊六入', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  const createBody = (await (await createResponse).json()) as {
    orderId: string
    orderPaymentPrice: number
  }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  const refundResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/refunds`) &&
      res.request().method() === 'POST' &&
      res.ok()
  )
  await row.getByRole('button', { name: '退款', exact: true }).click()
  const refundAuthDialog = page.getByRole('dialog', { name: '退款需要主管授權' })
  await refundAuthDialog.getByLabel('帳號').fill('lemon')
  await refundAuthDialog.getByLabel('PIN').fill('1234')
  await refundAuthDialog.getByRole('button', { name: '確認核可' }).click()
  await page.getByLabel('退款金額').fill('30')
  await page.getByLabel('退款原因').fill('少一份珍珠')
  await page.getByRole('button', { name: '確認退款' }).click()
  const refundBody = (await (await refundResponse).json()) as {
    orderStatus: string
    refundedAmount: number
  }
  expect(refundBody.orderStatus).toBe('已完成')
  expect(refundBody.refundedAmount).toBe(30)

  await expect(page.getByTestId('toast-message')).toHaveText('退款成功，已退 $30')
  await expect(row).toContainText('已退款 $30')
  await expect(row.getByRole('button', { name: '退款', exact: true })).toBeEnabled()

  // 驗證退款對話框顯示剩餘可退額度上限，超額時停用送出按鈕。
  await row.getByRole('button', { name: '退款', exact: true }).click()
  const secondRefundAuthDialog = page.getByRole('dialog', { name: '退款需要主管授權' })
  await secondRefundAuthDialog.getByLabel('帳號').fill('lemon')
  await secondRefundAuthDialog.getByLabel('PIN').fill('1234')
  await secondRefundAuthDialog.getByRole('button', { name: '確認核可' }).click()
  await expect(page.getByText('這筆訂單目前還能退 $ 50')).toBeVisible()
  await page.getByLabel('退款金額').fill('60')
  await page.getByLabel('退款原因').fill('超額測試')
  await expect(page.getByRole('button', { name: '確認退款' })).toBeDisabled()
})

test('作廢主管授權帳號或 PIN 錯誤時，整個作廢操作取消，不會送出任何請求', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('雞塊六入', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  const statusRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().includes(`/api/orders/${createBody.orderId}/status`))
      statusRequests.push(req.method())
  })

  await row.getByRole('button', { name: '作廢訂單' }).click()
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('0000')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()

  await expect(page.getByTestId('toast-message')).toHaveText('帳號或 PIN 錯誤，操作已取消')
  await expect(page.getByRole('dialog', { name: '作廢原因' })).toHaveCount(0)

  const orderStatus = await page.evaluate((orderId: string) => {
    const raw = localStorage.getItem('order')
    const state = raw ? JSON.parse(raw) : null
    return state?.order?.find((item: { orderId: string }) => item.orderId === orderId)?.orderStatus
  }, createBody.orderId)
  expect(orderStatus).toBe('已完成')
  expect(statusRequests).toEqual([])
})
