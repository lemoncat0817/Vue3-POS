import { expect, test } from '@playwright/test'

/**
 * D-04 迴歸驗證（規劃書 §18 缺陷目錄）：PIN 不應該出現在
 * localStorage——登入 store 原本整包 `persist: true`，「記住 PIN」
 * 勾選與否都不影響 pin 欄位被存進 localStorage 這件事，是明碼登入
 * 憑證外洩到裝置儲存空間的缺陷。見 stores/login.ts 的 persist.omit
 * 說明。
 */
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

  // 沒有勾選「記住帳號」，登出後帳號欄位應該被清空。
  await expect(page.getByPlaceholder('請輸入帳號')).toHaveValue('')
  await expect(page.getByPlaceholder('請輸入 PIN')).toHaveValue('')
})

/**
 * D-10 迴歸驗證（規劃書 §18 缺陷目錄）：權限管理頁編輯人員權限，只有
 * authorityCheckList 這一份來源，見 types/staff.ts 的說明。
 *
 * UI-6（規劃書 §5.4「權限管理」）重構後，人員名單表格不再有 18 個
 * O/X 權限欄——改成從 authorityCheckList 反推的「角色」摘要（見
 * utils/authority.ts 的 deriveStaffRole）。這裡驗證的東西沒變：勾選／
 * 取消一個權限、儲存後，名單上的角色摘要與再次打開的編輯視窗都要
 * 立刻反映同一份資料，不是讀另一份沒有同步更新的欄位——只是「反映」
 * 的畫面位置從表格欄位改成角色徽章與編輯視窗裡的 checkbox。
 */
test('D-10：編輯人員權限只有一份來源，取消勾選後名單角色摘要與編輯視窗立刻反映', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('權限管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)

  // James 種子資料的權限組合完全對應「值班經理」角色範本（見
  // apps/api/seed/staff.sql）。
  const jamesRow = page.getByRole('row', { name: /James/ })
  await expect(jamesRow.getByText('值班經理', { exact: true })).toBeVisible()

  // 選「James」這一列，開編輯視窗，取消勾選「查看數據分析」。
  await jamesRow.click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  const checkbox = page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })
  await expect(checkbox).toBeChecked()
  await checkbox.uncheck()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')

  // 少了一項權限，不再完全對應任何角色範本——名單上應該立刻顯示
  // 「自訂」（不是讀一份沒有同步更新的舊欄位）。
  await expect(jamesRow.getByText('自訂', { exact: true })).toBeVisible()

  // 重新打開編輯視窗，checkbox 狀態要跟著反映剛剛的變更——同一份
  // authorityCheckList，不是分頭維護的兩份狀態。
  await jamesRow.click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })).not.toBeChecked()

  // 這個編輯會真的呼叫伺服端（P18），會持久改掉 James 這筆種子資料，
  // 不像改之前純本機 Pinia 狀態、重新整理就恢復——把勾選狀態存回去，
  // 讓這個測試不管重跑幾次都是同一個起始狀態（種子資料裡 James 原本
  // 就對應「值班經理」角色範本）。
  await page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' }).check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(jamesRow.getByText('值班經理', { exact: true })).toBeVisible()
})
