import { expect, test } from '@playwright/test'

// 驗證後台桌位 CRUD、桌況備註切換，以及點餐內用桌號記錄。
test('後台新增桌位、切換桌況並帶備註、刪除桌位', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('桌況管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/tables$/)

  const tableNumber = `P24測試桌-${Date.now()}`

  await page.getByRole('button', { name: '新增桌位', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增桌位' })
  await addDialog.getByLabel('桌號').fill(tableNumber)
  await addDialog.getByLabel('座位數').fill('4')
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/tables') && res.request().method() === 'POST' && res.ok()
  )
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()
  const created = (await (await createResponse).json()) as { id: string; status: string }
  expect(created.status).toBe('empty')
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')

  const card = page.getByTestId('table-card').filter({ hasText: tableNumber })
  await expect(card).toContainText('空桌')

  await card.click()
  const statusDialog = page.getByRole('dialog', { name: `${tableNumber} 桌況` })
  await statusDialog.getByRole('button', { name: '使用中', exact: true }).click()
  await statusDialog.getByLabel('備註').fill('4 位客人，帶位 14:00')
  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/tables/') &&
      res.url().includes('/status') &&
      res.request().method() === 'PATCH' &&
      res.ok()
  )
  await statusDialog.getByRole('button', { name: '保存', exact: true }).click()
  await statusResponse
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(card).toContainText('使用中')
  await expect(card).toContainText('4 位客人，帶位 14:00')

  await card.click()
  const statusDialog2 = page.getByRole('dialog', { name: `${tableNumber} 桌況` })
  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/tables/') &&
      res.request().method() === 'DELETE' &&
      res.status() === 204
  )
  await statusDialog2.getByRole('button', { name: '刪除桌位', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('table-card').filter({ hasText: tableNumber })).toHaveCount(0)
})

test('點餐頁選內用時可以輸入桌號，送單後訂單帶著這個桌號、訂單列表看得到', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await expect(page.getByTestId('table-number-input')).toHaveCount(0)

  await page
    .getByTestId('order-channel-toggle')
    .getByRole('button', { name: '內用', exact: true })
    .click()
  await page.getByTestId('table-number-input').fill('B3')

  await page.getByText('輕食', { exact: true }).click()
  await page.getByText('薯條', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()
  const orderBody = (await (await createResponse).json()) as {
    orderId: string
    tableNumber: string | null
  }
  expect(orderBody.tableNumber).toBe('B3')

  await expect(page.getByTestId('table-number-input')).toHaveValue('')

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.getByTestId('order-row').filter({ hasText: orderBody.orderId })
  await expect(row).toBeVisible()
  await row.locator('button[aria-label="展開明細"]').click()
  await expect(page.getByText('桌號 B3')).toBeVisible()
})
