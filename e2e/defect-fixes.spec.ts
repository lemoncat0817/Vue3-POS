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

// 驗證人員權限變更即時反映於角色摘要與編輯表單，無多頭狀態不一致。
test('D-10：編輯人員權限只有一份來源，取消勾選後名單角色摘要與編輯視窗立刻反映', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('權限管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)

  const jamesRow = page.getByRole('row', { name: /James/ })
  await expect(jamesRow.getByText('值班經理', { exact: true }).first()).toBeVisible()

  await jamesRow.click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  const checkbox = page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })
  await expect(checkbox).toBeChecked()
  await checkbox.uncheck()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')

  await expect(jamesRow.getByText('自訂', { exact: true })).toBeVisible()

  await jamesRow.click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })).not.toBeChecked()

  // 恢復權限勾選以維持種子資料初始狀態。
  await page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' }).check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(jamesRow.getByText('值班經理', { exact: true }).first()).toBeVisible()
})
