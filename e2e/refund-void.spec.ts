import { expect, test } from '@playwright/test'

/**
 * P12 迴歸驗證（規劃書 §10 P0「退款／作廢」）：
 *
 * - 作廢：訂單狀態改成「已取消」時必須填寫原因，伺服端記錄
 *   voidReason／voidedBy／voidedAt（見 apps/api/src/routes/orders.ts
 *   的 updateOrderStatusRequestSchema）。
 * - 退款：訂單維持「已完成」，只多記一筆退款紀錄，畫面顯示
 *   「已退款 $X」，退款金額不能超過目前還能退的額度。
 *
 * 這裡用真正的 wrangler dev + 本機 D1 驗證，不 mock 任何請求。
 */
test('作廢訂單需要填寫原因，畫面與伺服端都記錄下這個原因', async ({ page }) => {
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
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  // P19：作廢需要主管二次授權，先用店長自己的帳號＋PIN 核可（見
  // composables/useManagerAuth.ts 的說明——核可者可以是操作員自己）。
  await row.getByRole('button', { name: '編輯訂單狀態' }).click()
  await page.getByRole('button', { name: '已取消', exact: true }).click()
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('1234')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()

  // 選「已取消」但不填原因就按確認作廢——按鈕應該是停用的，對話框
  // 不會關閉，也不會送出任何請求。
  await expect(page.getByRole('button', { name: '確認作廢' })).toBeDisabled()

  // 填上原因後才能送出。
  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/status`) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
  )
  await page.getByRole('textbox', { name: '原因' }).fill('客人臨時取消訂單')
  await page.getByRole('button', { name: '確認作廢' }).click()
  const statusBody = (await (await statusResponse).json()) as { orderStatus: string; voidReason: string; voidedBy: string }
  expect(statusBody.orderStatus).toBe('已取消')
  expect(statusBody.voidReason).toBe('客人臨時取消訂單')
  expect(statusBody.voidedBy).toContain('Lemon')

  await expect(page.getByTestId('toast-message')).toHaveText('訂單狀態已設定為已取消')
  await expect(row).toContainText('已取消')

  // 展開明細，看得到作廢原因。
  await row.locator('button[aria-label="展開明細"]').click()
  await expect(page.getByText('作廢原因：客人臨時取消訂單')).toBeVisible()
})

test('部分退款：訂單維持已完成，畫面顯示已退款金額，超過可退額度時伺服端拒絕', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 楊枝甘露2.0（priceL 80）。
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
  const createBody = (await (await createResponse).json()) as { orderId: string; orderPaymentPrice: number }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  // 退 30 元（訂單 80 元）——對話框預設帶入全額，改成 30。P19：退款
  // 需要主管二次授權，先用店長自己的帳號＋PIN 核可，見上面作廢測試的
  // 說明。
  const refundResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/orders/${createBody.orderId}/refunds`) && res.request().method() === 'POST' && res.ok(),
  )
  await row.getByRole('button', { name: '退款', exact: true }).click()
  const refundAuthDialog = page.getByRole('dialog', { name: '退款需要主管授權' })
  await refundAuthDialog.getByLabel('帳號').fill('lemon')
  await refundAuthDialog.getByLabel('PIN').fill('1234')
  await refundAuthDialog.getByRole('button', { name: '確認核可' }).click()
  await page.getByLabel('退款金額').fill('30')
  await page.getByLabel('退款原因').fill('少一份珍珠')
  await page.getByRole('button', { name: '確認退款' }).click()
  const refundBody = (await (await refundResponse).json()) as { orderStatus: string; refundedAmount: number }
  expect(refundBody.orderStatus).toBe('已完成')
  expect(refundBody.refundedAmount).toBe(30)

  await expect(page.getByTestId('toast-message')).toHaveText('退款成功，已退 $30')
  await expect(row).toContainText('已退款 $30')
  // 訂單狀態仍是已完成，不是已取消。
  await expect(row.getByRole('button', { name: '退款', exact: true })).toBeEnabled()

  // 再退款時，對話框應該只顯示剩餘可退額度（80 − 30 = 50），不是
  // 原始訂單金額——輸入超過這個上限，「確認退款」要停用，不能送出。
  // 超過額度時伺服端仍會拒絕（見 apps/api/test/orders.spec.ts 的
  // 「退款金額超過還能退的額度時拒絕，回傳 400」），這裡只驗證畫面
  // 這一層的防線。
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

/**
 * P19 迴歸驗證（規劃書 §10 P19「退款／作廢主管二次授權」）：主管授權
 * 帳號或 PIN 錯誤時，作廢對話框根本不會打開，也不會送出任何
 * PATCH /api/orders/:id/status 請求——見 composables/useManagerAuth.ts
 * 的說明，這是在既有「操作員本身有沒有 canEditOrderStatus」權限檢查
 * 之外，額外的一道現場核可關卡。
 */
test('作廢主管授權帳號或 PIN 錯誤時，整個作廢操作取消，不會送出任何請求', async ({ page }) => {
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
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  const statusRequests: string[] = []
  page.on('request', (req) => {
    if (req.url().includes(`/api/orders/${createBody.orderId}/status`)) statusRequests.push(req.method())
  })

  await row.getByRole('button', { name: '編輯訂單狀態' }).click()
  await page.getByRole('button', { name: '已取消', exact: true }).click()
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('0000')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()

  await expect(page.getByTestId('toast-message')).toHaveText('帳號或 PIN 錯誤，操作已取消')
  // 作廢原因對話框沒有打開——核可失敗，整個操作在這裡就結束了。
  await expect(page.getByRole('dialog', { name: '作廢原因' })).toHaveCount(0)

  const orderStatus = await page.evaluate((orderId: string) => {
    const raw = localStorage.getItem('order')
    const state = raw ? JSON.parse(raw) : null
    return state?.order?.find((item: { orderId: string }) => item.orderId === orderId)?.orderStatus
  }, createBody.orderId)
  expect(orderStatus).toBe('已完成')
  expect(statusRequests).toEqual([])
})
