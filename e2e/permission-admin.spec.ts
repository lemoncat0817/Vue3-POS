import { expect, test } from '@playwright/test'

// 驗證人員管理與付款方式設定之後台 CRUD 與狀態持久化。
test('後台新增／刪除人員會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '權限管理', exact: true }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)

  const staffName = `E2E測試員工-${Date.now()}`
  const staffAccount = `e2e${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/staff') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByRole('button', { name: '＋ 新增人員', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增人員' })
  await addDialog.getByPlaceholder('例如: Jensen、Jacky...').fill(staffName)
  await addDialog.getByPlaceholder('例如: 襄理、工讀生...').fill('E2E測試職稱')
  await addDialog.getByPlaceholder('請輸入帳號').fill(staffAccount)
  await addDialog.getByPlaceholder('4~6碼數字').fill('9999')
  await addDialog.getByText('選擇權限群組').click()
  await page.getByRole('option', { name: '工讀生' }).click()
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as {
    id: string
    name: string
    account: string
  }
  expect(createBody).toMatchObject({ name: staffName, account: staffAccount })
  expect(typeof createBody.id).toBe('string')
  expect(createBody.id.length).toBeGreaterThan(0)

  await expect(page.getByTestId('toast-message')).toHaveText('新增人員成功')
  await expect(page.getByText(staffName)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '權限管理', exact: true }).click()
  await expect(page.getByText(staffName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/staff/${createBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204
  )
  await page
    .getByRole('row', { name: new RegExp(staffName) })
    .getByRole('button', { name: '刪除', exact: true })
    .click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(staffName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '權限管理', exact: true }).click()
  await expect(page.getByText(staffName)).toHaveCount(0)
})

test('後台新增／刪除付款方式會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '付款方式', exact: true }).click()

  const methodName = `E2E測試付款-${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/payment-methods') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByRole('button', { name: '＋ 新增付款方式', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增付款方式' })
  await addDialog.getByPlaceholder('例如: 現金、LinePay...').fill(methodName)
  await addDialog.getByText('選擇支付方式').click()
  await page.getByRole('option', { name: '感應', exact: true }).click()
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as {
    id: string
    name: string
    useMethod: string
  }
  expect(createBody).toMatchObject({ name: methodName, useMethod: '感應' })
  expect(typeof createBody.id).toBe('string')
  expect(createBody.id.length).toBeGreaterThan(0)

  await expect(page.getByTestId('toast-message')).toHaveText('新增付款方式成功')
  await expect(page.getByText(methodName)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '付款方式', exact: true }).click()
  await expect(page.getByText(methodName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/payment-methods/${createBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204
  )
  await page
    .getByRole('row', { name: methodName })
    .getByRole('button', { name: '刪除', exact: true })
    .click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(methodName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '付款方式', exact: true }).click()
  await expect(page.getByText(methodName)).toHaveCount(0)
})
