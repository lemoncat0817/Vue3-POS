import { expect, test } from '@playwright/test'

/**
 * P5 迴歸驗證：訂單層級折價券的折抵金額由伺服端查真正的折價券資料
 * 重算，不是信任用戶端算好的數字（見 apps/api/src/routes/orders.ts
 * 的 resolveOrderPayment() 說明）。這裡用真正的 wrangler dev + 本機 D1
 * （已套用 seed/promotions.sql）驗證：套用「$50折價券」後，畫面顯示
 * 與伺服端回應的應付金額都要是 80-50=30 元。
 */
test('套用現金折價券後，畫面顯示與伺服端回應的折抵金額一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 點一杯「楊枝甘露2.0」（priceL 80）。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  // 開優惠券選單，套用種子資料裡的「$50折價券」。
  await page.getByRole('button', { name: '優惠券', exact: true }).click()
  await page.getByText('$50折價券', { exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()

  await expect(page.getByText('$ 30 元')).toBeVisible()

  const orderResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
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

  const res = await orderResponse
  const body = (await res.json()) as { orderPaymentPrice: number; orderDiscount: number; discountName: string }
  expect(body.discountName).toBe('$50折價券')
  expect(body.orderDiscount).toBe(50)
  expect(body.orderPaymentPrice).toBe(30)
})
