import { expect, test } from '@playwright/test'

// 驗證內用／外帶通路切換、送單記錄與訂單列表顯示。
test('切換成內用後送單，伺服端記錄的 orderChannel 是內用，訂單列表顯示內用', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const toggle = page.getByTestId('order-channel-toggle')
  await expect(toggle.getByRole('button', { name: '外帶' })).toHaveClass(/bg-primary-600/)

  await toggle.getByRole('button', { name: '內用' }).click()
  await expect(toggle.getByRole('button', { name: '內用' })).toHaveClass(/bg-primary-600/)

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
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
  const createBody = (await (await createResponse).json()) as {
    orderId: string
    orderChannel: string
  }
  expect(createBody.orderChannel).toBe('內用')

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: createBody.orderId })
  await expect(row).toContainText('內用')
})
