import { expect, test } from '@playwright/test'

// 驗證訂單折價券套用、金額折抵與伺服端重算校驗。
test('套用現金折價券後，畫面顯示與伺服端回應的折抵金額一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('雞塊六入', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  await page.getByRole('button', { name: '優惠券', exact: true }).click()
  await page.getByText('$50折價券', { exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()

  await expect(page.getByText('$ 30 元')).toBeVisible()

  const orderResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')

  const res = await orderResponse
  const body = (await res.json()) as {
    orderPaymentPrice: number
    orderDiscount: number
    discountName: string
  }
  expect(body.discountName).toBe('$50折價券')
  expect(body.orderDiscount).toBe(50)
  expect(body.orderPaymentPrice).toBe(30)
})
