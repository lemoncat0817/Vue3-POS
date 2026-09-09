import { expect, test } from '@playwright/test'

// 驗證班別開帳、現金異動存入與收班結算帳差計算。
test('開帳、中途存入現金、收班：畫面顯示的帳差與伺服端回應一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const shiftStatus = page.getByTestId('shift-status')
  await expect(shiftStatus).toContainText('尚未開帳')

  await shiftStatus.click()
  await page.getByRole('heading', { name: '班別結帳' }).waitFor()
  await page.getByRole('spinbutton').fill('3000')
  const openResponse = page.waitForResponse(
    (res) => res.url().includes('/api/shifts') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '開帳', exact: true }).click()
  const openBody = (await (await openResponse).json()) as { id: string; status: string; openingFloat: number }
  expect(openBody.status).toBe('open')
  expect(openBody.openingFloat).toBe(3000)

  await expect(shiftStatus).toContainText('營業中')

  await shiftStatus.click()
  await page.getByLabel('金額').fill('500')
  await page.getByLabel('原因').fill('追加零錢準備金')
  const movementResponse = page.waitForResponse(
    (res) => res.url().includes('/cash-movements') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '存入', exact: true }).click()
  const movementBody = (await (await movementResponse).json()) as { cashIn: number }
  expect(movementBody.cashIn).toBe(500)

  await page.getByRole('button', { name: '收班', exact: true }).click()
  await expect(page.getByText('$ 3500')).toBeVisible()

  const closeResponse = page.waitForResponse(
    (res) => res.url().includes('/close') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '確認收班', exact: true }).click()
  const closeBody = (await (await closeResponse).json()) as { status: string; expectedCash: number; variance: number }
  expect(closeBody.status).toBe('closed')
  expect(closeBody.expectedCash).toBe(3500)
  expect(closeBody.variance).toBe(0)

  await expect(page.getByTestId('toast-message')).toHaveText('收班完成，帳差 0')
  await expect(shiftStatus).toContainText('尚未開帳')
})
