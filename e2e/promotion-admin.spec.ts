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
  // P8：後台管理頁的 el-dialog 改成 Reka UI Dialog（見
  // components/ui/ModalDialog.vue 的說明），用 role="dialog" 定位。
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addDialog = page.getByRole('dialog', { name: '新增現金折扣券' })
  await addDialog.getByPlaceholder('例如: $50折價券...').fill(couponName)
  await addDialog.getByPlaceholder('純數字,例如:1,2,3...').fill('42')
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string; discountMoney: number }
  expect(createBody).toMatchObject({ name: couponName, discountMoney: 42 })
  // Id 是伺服端配發的 UUID，不是使用者輸入的小整數。
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  // P8：ElMessage 改用 Reka Toast（見 components/ui/ToastHost.vue 的
  // 說明），畫面上這則訊息用 testid 定位，避免跟 Reka 另外渲染的
  // aria-live 隱藏播報文字撞在一起。
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
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
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(couponName)).toHaveCount(0)

  await page.reload()
  await page.locator('p').filter({ hasText: '後台設定' }).click()
  await page.getByText('優惠設定', { exact: true }).click()
  await expect(page.getByText(couponName)).toHaveCount(0)
})

/**
 * P8 迴歸驗證：新增／編輯／刪除三個對話框各自是獨立的 VeeValidate
 * `<Form>` 元件實例（見 offerSetting/index.vue 的說明）——過程中曾經
 * 因為在同一個 `<script setup>` 裡對 5 個表單各自呼叫一次 useForm()
 * 組合式 API，Vue 的 provide() 被後呼叫的覆蓋掉，導致「新增」對話框
 * 送出後完全沒反應（見同一份說明的完整經過）。這裡除了驗證編輯流程
 * 本身，也刻意涵蓋「沒有先選取項目」與「欄位驗證不通過」這兩個編輯
 * 流程獨有、原本的新增／刪除測試涵蓋不到的路徑。
 */
test('後台編輯現金折價券：沒選取會提示、欄位不合法會即時顯示錯誤、合法送出會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.locator('p').filter({ hasText: '後台設定' }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByText('優惠設定', { exact: true }).click()

  // 沒有先選取任何一列就點編輯：改成非阻斷式的 toast 提示（見
  // offerSetting/index.vue 的說明），不是 ElMessageBox.alert 那種要
  // 額外點掉才能繼續操作的對話框。
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  await expect(page.getByTestId('toast-message')).toHaveText('請先選擇要編輯的折扣券')

  // 建一張測試用的折價券，接下來編輯它。
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

  // 選取剛建立的這一列，開編輯對話框——欄位要預先帶入目前的值。
  await page.getByText(couponName, { exact: true }).click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  const editDialog = page.getByRole('dialog', { name: '編輯現金折扣券' })
  await expect(editDialog.getByPlaceholder('例如: $50折價券...')).toHaveValue(couponName)
  await expect(editDialog.getByPlaceholder('純數字,例如:1,2,3...')).toHaveValue('10')

  // 改成跟既有折價券（$50折價券，種子資料）撞名——欄位下方要即時顯示
  // 錯誤，不送出任何請求。
  await editDialog.getByPlaceholder('例如: $50折價券...').fill('$50折價券')
  await editDialog.getByRole('button', { name: '保存', exact: true }).click()
  await expect(editDialog.getByText('此折扣券名稱已存在,請重新輸入')).toBeVisible()
  await expect(editDialog).toBeVisible()

  // 改成合法的新名稱＋新金額，應該真的送出 PUT 並更新畫面。填完先確認
  // 欄位真的吃到新值（等 VeeValidate 的 reactivity 穩定），不然緊接著
  // 點保存偶爾會用到還沒更新前的舊值送出——這是實際發生過的 e2e flake，
  // 不是假設性的預防。
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

  // 清掉測試資料。
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/promotions/money-coupons/${createBody.id}`) && res.request().method() === 'DELETE',
  )
  await page.getByRole('button', { name: '刪除', exact: true }).first().click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByText(updatedName)).toHaveCount(0)
})
