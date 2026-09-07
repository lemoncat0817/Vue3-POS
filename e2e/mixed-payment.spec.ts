import { expect, test } from '@playwright/test'

/**
 * P6 迴歸驗證（規劃書 §10 P0「混合支付」）：一筆訂單可以用多種支付
 * 方式分攤付款，現金支付可以填「實收金額」讓系統算出找零，且伺服端
 * 不信任用戶端算的合計（見 apps/api/src/routes/orders.ts 的
 * validateTenders 說明）。這裡用真正的 wrangler dev + 本機 D1 驗證：
 * 送出的 POST /api/orders 請求真的帶了 tenders 陣列、回應的
 * changeDue／tenders 跟畫面上 PaymentPanel 顯示的一致。
 */
test('現金找零：實收金額大於應付金額時，面板與伺服端回應算出同一個找零', async ({ page }) => {
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

  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  // 分擔金額預設帶入剩餘應付（80），實收填 500，找零應該是 420。
  await page.getByLabel('實收金額（選填，用來算找零）').fill('500')
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await expect(page.getByText('現金', { exact: true })).toBeVisible()
  await expect(page.getByText('（實收 $ 500）')).toBeVisible()
  await expect(page.getByText('$ 420')).toBeVisible()

  const orderResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  const body = (await (await orderResponse).json()) as {
    changeDue: number
    tenders: { method: string; amount: number; receivedAmount?: number }[]
  }
  expect(body.changeDue).toBe(420)
  expect(body.tenders).toEqual([{ method: '現金', amount: 80, receivedAmount: 500 }])

  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()
})

test('混合支付：現金＋信用卡各分擔一部分，伺服端摘要用頓號連接付款方式', async ({ page }) => {
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
  // 應付 80 元，現金分擔 30 元。
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByLabel('分擔金額').fill('30')
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await expect(page.getByText('$ 50', { exact: true })).toBeVisible() // 剩餘應付

  // 剩下的 50 元用信用卡付清。
  await page.getByRole('button', { name: '信用卡', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()

  const orderResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  const body = (await (await orderResponse).json()) as { orderPayment: string; changeDue: number }
  expect(body.orderPayment).toBe('現金、信用卡')
  expect(body.changeDue).toBe(0)

  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()
})
