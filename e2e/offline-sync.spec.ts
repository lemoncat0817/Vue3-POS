import { expect, test } from '@playwright/test'

// 驗證斷網時訂單寫入離線佇列，恢復連線後由 SyncWorker 自動重試同步且無重複送單。
test('斷網時送出的 3 張訂單先落地本機佇列，重新連線後自動同步且不重複', async ({ page, context }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 離線前預熱 lazy route chunk，避免斷網時因無法下載切頁腳本而失敗。
  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  await page.getByText('點餐', { exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)

  await context.setOffline(true)

  const submitOneOrder = async () => {
    await page.getByText('輕食', { exact: true }).click()
    await page.getByText('薯條', { exact: true }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: '新增', exact: true }).click()
    await page.getByTestId('checkout-button').click()
    await page.getByRole('button', { name: '現金', exact: true }).click()
    await page.getByRole('button', { name: '加入', exact: true }).click()
    await page.getByRole('button', { name: '確認送出', exact: true }).click()
    await expect(page.getByTestId('toast-message').last()).toHaveText('訂單送出成功')
    await page.getByRole('button', { name: '繼續選取品項' }).click()
  }

  await submitOneOrder()
  await submitOneOrder()
  await submitOneOrder()

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  await expect(page.getByTestId('order-row')).toHaveCount(7)

  const syncBadge = page.getByTestId('sync-status')
  await expect(syncBadge).toContainText('3 筆')

  const syncedOrderIds = new Set<string>()
  page.on('response', (res) => {
    if (res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()) {
      void res
        .json()
        .then((body: { orderId?: string }) => {
          if (body.orderId) syncedOrderIds.add(body.orderId)
        })
        .catch(() => undefined)
    }
  })

  await context.setOffline(false)

  await expect.poll(() => syncedOrderIds.size, { timeout: 20_000, intervals: [500] }).toBe(3)
  await expect(syncBadge).toBeHidden()
})
