import { expect, test } from '@playwright/test'

// 驗證後台優惠設定 CRUD 與伺服端資料持久化。訂單折價券頁籤為預設分頁，不需另外切換。
test('後台新增／刪除訂單折價券會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByText('優惠設定', { exact: true }).click()

  const couponName = `E2E測試折價券-${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/promotions/order-coupons') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '＋ 新增折價券', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增訂單折價券' })
  await addDialog.getByPlaceholder('例如: $50折價券、整單95折...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:50,100...').fill('42')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string; kind: string; value: number }
  expect(createBody).toMatchObject({ name: couponName, kind: 'amount', value: 42 })
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
  await expect(page.getByText(couponName)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/promotions/order-coupons/${createBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204,
  )
  const row = page.locator('tr', { hasText: couponName })
  await row.getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(couponName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toHaveCount(0)
})

test('後台編輯訂單折價券：切換類型後改用折數欄位、合法送出會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByText('優惠設定', { exact: true }).click()

  const couponName = `E2E編輯測試券-${Date.now()}`
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/promotions/order-coupons') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '＋ 新增折價券', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增訂單折價券' })
  await addDialog.getByPlaceholder('例如: $50折價券、整單95折...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:50,100...').fill('10')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()
  const createBody = (await (await createResponse).json()) as { id: string }

  const row = page.locator('tr', { hasText: couponName })
  await row.getByRole('button', { name: '編輯', exact: true }).click()
  const editDialog = page.getByRole('dialog', { name: '編輯訂單折價券' })
  await expect(editDialog.getByPlaceholder('例如: $50折價券、整單95折...')).toHaveValue(couponName)
  await expect(editDialog.getByPlaceholder('純數字,例如:50,100...')).toHaveValue('10')

  // 切換成折數折抵，欄位需跟著換成折數用的 placeholder。
  await editDialog.getByRole('combobox').selectOption('percent')
  await expect(editDialog.getByPlaceholder('純數字,例如:0.9,0.75...')).toBeVisible()
  await editDialog.getByPlaceholder('純數字,例如:0.9,0.75...').fill('0.9')

  const updateResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/promotions/order-coupons/${createBody.id}`) &&
      res.request().method() === 'PUT' &&
      res.ok(),
  )
  await editDialog.getByRole('button', { name: '保存', exact: true }).click()
  const updateBody = (await (await updateResponse).json()) as { name: string; kind: string; value: number }
  expect(updateBody).toMatchObject({ name: couponName, kind: 'percent', value: 0.9 })
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')

  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/promotions/order-coupons/${createBody.id}`) && res.request().method() === 'DELETE',
  )
  await row.getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByText(couponName)).toHaveCount(0)
})
