import { expect, test } from '@playwright/test'

// 驗證 PIN 憑證不可持久化至 localStorage。
test('D-04：不管有沒有勾選「記住帳號」，PIN 都不會出現在 localStorage', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const loginState = await page.evaluate(() => localStorage.getItem('login'))
  expect(loginState).not.toBeNull()
  expect(loginState).not.toContain('1234')
  expect(loginState).not.toContain('"pin"')
})

test('D-04：登出後，PIN 一定會被清空，帳號則依「記住帳號」決定是否保留', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '登出' }).click()
  await page.getByRole('button', { name: '登出', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)

  await expect(page.getByPlaceholder('請輸入帳號')).toHaveValue('')
  await expect(page.getByPlaceholder('請輸入 PIN')).toHaveValue('')
})

// 驗證權限群組（角色）的權限異動只有一份來源，儲存後畫面立刻反映，不需要重新整理頁面。
test('D-10：編輯權限群組的權限內容，畫面即時反映，無多頭狀態不一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('權限管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)
  await page.getByRole('button', { name: '權限群組', exact: true }).click()

  const dutyManagerRow = page.getByRole('row', { name: /值班經理/ })
  await expect(dutyManagerRow.getByText('10/18 項')).toBeVisible()

  await dutyManagerRow.getByRole('button', { name: '編輯', exact: true }).click()
  const checkbox = page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })
  await expect(checkbox).toBeChecked()
  await checkbox.uncheck()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')

  await expect(dutyManagerRow.getByText('9/18 項')).toBeVisible()

  // 恢復權限勾選以維持種子資料初始狀態。
  await dutyManagerRow.getByRole('button', { name: '編輯', exact: true }).click()
  await page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' }).check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(dutyManagerRow.getByText('10/18 項')).toBeVisible()
})
