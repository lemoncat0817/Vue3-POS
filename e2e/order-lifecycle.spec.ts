import { expect, test } from '@playwright/test'

/**
 * P6 迴歸驗證：訂單列表頁「編輯訂單狀態」／「刪除訂單」改成真的呼叫
 * apps/api（見 apps/pos/src/views/order/index.vue、api/orders.ts 的
 * 說明），不再只是改本機 Pinia 狀態。這裡對真正的 wrangler dev + 本機
 * D1 驗證：改狀態、刪除都真的送出對應的 PATCH／DELETE 請求，且伺服端
 * 回應成功後畫面才更新。
 */
test('編輯訂單狀態與刪除訂單會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 送一筆真的訂單，等它同步到伺服端（拿到伺服端配發的正式 orderId，
  // 見 stores/order.ts 的 reconcileOrderId 說明）——這兩個操作都要求
  // 訂單已經存在於伺服端，用本機還沒同步過的假 orderId 會收到 404。
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  // P6：組件庫替換示範頁「送出訂單」單一按鈕＋兩層確認框，改成
  // 「結帳」開啟 PaymentPanel（見 components/checkout/PaymentPanel.vue）。
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  // P8：ElMessage 改用 Reka Toast（見 components/ui/ToastHost.vue 的
  // 說明），畫面上這則訊息用 testid 定位，避免跟 Reka 另外渲染的
  // aria-live 隱藏播報文字撞在一起。
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  // 送單後待付款清單歸零會另外彈一次通知，關掉才能繼續點側邊欄。
  await page.getByRole('button', { name: '繼續選取品項' }).click()
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  // P8：訂單表格改用 TanStack Table 搭配自訂 Tailwind 標記（見
  // views/order/index.vue 的說明），不再是 el-table，row 用
  // data-testid="order-row" 定位。
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toBeVisible()

  // 編輯訂單狀態 → 選「已取消」（點取消按鈕，見 editOrderStatus 的說明）。
  // P12：改成「已取消」現在是真正的作廢操作，選了「已取消」之後還要
  // 再填一次作廢原因（見 composables/usePrompt.ts、PromptDialogHost.vue）。
  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/status`) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
  )
  await row.getByRole('button', { name: '編輯訂單狀態' }).click()
  await page.getByRole('button', { name: '已取消', exact: true }).click()
  // P19：作廢需要主管二次授權（見 composables/useManagerAuth.ts 的
  // 說明），這裡用店長自己的帳號＋PIN 核可。
  const voidAuthDialog = page.getByRole('dialog', { name: '作廢需要主管授權' })
  await voidAuthDialog.getByLabel('帳號').fill('lemon')
  await voidAuthDialog.getByLabel('PIN').fill('1234')
  await voidAuthDialog.getByRole('button', { name: '確認核可' }).click()
  await page.getByRole('textbox', { name: '原因' }).fill('客人臨時取消')
  await page.getByRole('button', { name: '確認作廢' }).click()
  const statusBody = (await (await statusResponse).json()) as { orderStatus: string; voidReason: string }
  expect(statusBody.orderStatus).toBe('已取消')
  expect(statusBody.voidReason).toBe('客人臨時取消')
  // P8：ElMessage 改用 Reka Toast（見 components/ui/ToastHost.vue 的
  // 說明），畫面上這則訊息用 testid 定位，避免跟 Reka 另外渲染的
  // aria-live 隱藏播報文字撞在一起。
  await expect(page.getByTestId('toast-message')).toHaveText('訂單狀態已設定為已取消')
  await expect(row).toContainText('已取消')

  // 刪除訂單，確認畫面上這一列真的消失，且是等伺服端回應成功才消失。
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
