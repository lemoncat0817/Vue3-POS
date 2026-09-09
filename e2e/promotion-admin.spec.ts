import { expect, test } from '@playwright/test'

// 驗證後台優惠設定 CRUD 與伺服端資料持久化。
test('後台新增／刪除現金折價券會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
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
    (res) => res.url().includes('/api/promotions/money-coupons') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addDialog = page.getByRole('dialog', { name: '新增現金折扣券' })
  await addDialog.getByPlaceholder('例如: $50折價券...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:1,2,3...').fill('42')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string; discountMoney: number }
  expect(createBody).toMatchObject({ name: couponName, discountMoney: 42 })
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
  await expect(page.getByText(couponName)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/promotions/money-coupons/${createBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204,
  )
  await page.getByText(couponName, { exact: true }).click()
  await page.getByRole('button', { name: '刪除', exact: true }).first().click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(couponName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toHaveCount(0)
})

test('後台編輯現金折價券：沒選取會提示、欄位不合法會即時顯示錯誤、合法送出會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByText('優惠設定', { exact: true }).click()

  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  await expect(page.getByTestId('toast-message')).toHaveText('請先選擇要編輯的折扣券')

  const couponName = `E2E編輯測試券-${Date.now()}`
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/promotions/money-coupons') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addDialog = page.getByRole('dialog', { name: '新增現金折扣券' })
  await addDialog.getByPlaceholder('例如: $50折價券...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:1,2,3...').fill('10')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()
  const createBody = (await (await createResponse).json()) as { id: string }

  await page.getByText(couponName, { exact: true }).click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  const editDialog = page.getByRole('dialog', { name: '編輯現金折扣券' })
  await expect(editDialog.getByPlaceholder('例如: $50折價券...')).toHaveValue(couponName)
  await expect(editDialog.getByPlaceholder('純數字,例如:1,2,3...')).toHaveValue('10')

  await editDialog.getByPlaceholder('例如: $50折價券...').fill('$50折價券')
  await editDialog.getByRole('button', { name: '保存', exact: true }).click()
  await expect(editDialog.getByText('此折扣券名稱已存在,請重新輸入')).toBeVisible()
  await expect(editDialog).toBeVisible()

  // 確認輸入欄位值已同步至表單狀態後再提交，避免未及更新之時序競爭。
  const updatedName = `${couponName}-已編輯`
  const editNameInput = editDialog.getByPlaceholder('例如: $50折價券...')
  const editMoneyInput = editDialog.getByPlaceholder('純數字,例如:1,2,3...')
  await editNameInput.fill(updatedName)
  await expect(editNameInput).toHaveValue(updatedName)
  await editMoneyInput.fill('88')
  await expect(editMoneyInput).toHaveValue('88')
  const updateResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/promotions/money-coupons/${createBody.id}`) &&
      res.request().method() === 'PUT' &&
      res.ok(),
  )
  await editDialog.getByRole('button', { name: '保存', exact: true }).click()
  const updateBody = (await (await updateResponse).json()) as { name: string; discountMoney: number }
  expect(updateBody).toMatchObject({ name: updatedName, discountMoney: 88 })
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(page.getByText(updatedName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/promotions/money-coupons/${createBody.id}`) && res.request().method() === 'DELETE',
  )
  await page.getByRole('button', { name: '刪除', exact: true }).first().click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByText(updatedName)).toHaveCount(0)
})
