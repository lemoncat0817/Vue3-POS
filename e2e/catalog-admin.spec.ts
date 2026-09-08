import { expect, test } from '@playwright/test'

/**
 * P18 迴歸驗證（規劃書 §10 P18「菜單與權限管理接上伺服端」）：後台
 * 「商品管理」頁的飲品類型新增／刪除改成真的呼叫 apps/api 的菜單寫入
 * 端點（見 views/backgroundSetting/productManagement/index.vue 的
 * 說明），不再只是本機 drinkStore 陣列操作。這裡對真正的 wrangler dev
 * + 本機 D1 驗證新增一個飲品類型後，Id 是伺服端配發的 UUID（不是使用者
 * 手動輸入的數字），且刪除後真的從伺服端的資料也消失（重新整理仍然
 * 看不到）。
 */
test('後台新增／刪除飲品類型會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '商品管理', exact: true }).click()

  const typeName = `E2E測試類型-${Date.now()}`
  const typeCode = `e2eType${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/catalog/groups') && res.request().method() === 'POST' && res.ok(),
  )
  // 飲品類型區塊在畫面上排第一個，「新增」按鈕也是第一個。
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addDialog = page.getByRole('dialog', { name: '新增飲品類型' })
  await addDialog.getByPlaceholder('例如: 原味茶,芝芝系列...').fill(typeName)
  await addDialog.getByPlaceholder('例如: drinkMilk...').fill(typeCode)
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string; type: string }
  expect(createBody).toMatchObject({ name: typeName, type: typeCode })
  // Id 是伺服端配發的 UUID，不是使用者輸入的小整數。
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
  await expect(page.getByText(typeName)).toBeVisible()

  // 重新整理後仍然看得到（證明是真的存在伺服端，不是只在這個分頁的記憶體裡）。
  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await expect(page.getByText(typeName)).toBeVisible()

  // 清掉這筆測試資料：選取該列 → 刪除 → 確認。
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/catalog/groups/${createBody.id}`) && res.request().method() === 'DELETE' && res.status() === 204,
  )
  await page.getByText(typeName, { exact: true }).click()
  await page.getByRole('button', { name: '刪除', exact: true }).first().click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(typeName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await expect(page.getByText(typeName)).toHaveCount(0)
})
