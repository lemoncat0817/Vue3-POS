import { expect, test } from '@playwright/test'

/**
 * P5 迴歸驗證：後台「優惠設定」頁的新增／刪除改成真的呼叫 apps/api 的
 * 促銷寫入端點（見 views/backgroundSetting/offerSetting/index.vue 的
 * 說明），不再只是本機陣列操作。這裡對真正的 wrangler dev + 本機 D1
 * 驗證新增一張現金折價券後，Id 是伺服端配發的（不是使用者手動輸入的
 * 數字），且刪除後真的從伺服端的資料也消失（重新整理仍然看不到）。
 */
test('後台新增／刪除現金折價券會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.locator('p').filter({ hasText: '後台設定' }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByText('優惠設定', { exact: true }).click()

  const couponName = `E2E測試折價券-${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/promotions/money-coupons') && res.request().method() === 'POST' && res.ok(),
  )
  // 現金折扣券區塊在畫面上排第一個，「新增」按鈕也是第一個。
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addDialog = page.locator('.el-dialog').filter({ hasText: '新增現金折扣券' })
  await addDialog.getByPlaceholder('例如: $50折價券...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:1,2,3...').fill('42')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string; discountMoney: number }
  expect(createBody).toMatchObject({ name: couponName, discountMoney: 42 })
  // Id 是伺服端配發的 UUID，不是使用者輸入的小整數。
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  await expect(page.getByText('新增成功')).toBeVisible()
  await expect(page.getByText(couponName)).toBeVisible()

  // 重新整理後仍然看得到（證明是真的存在伺服端，不是只在這個分頁的記憶體裡）。
  await page.reload()
  await page.locator('p').filter({ hasText: '後台設定' }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toBeVisible()

  // 清掉這筆測試資料：選取該列 → 刪除 → 確認。
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
  await expect(page.getByText('刪除成功')).toBeVisible()
  await expect(page.getByText(couponName)).toHaveCount(0)

  await page.reload()
  await page.locator('p').filter({ hasText: '後台設定' }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toHaveCount(0)
})
