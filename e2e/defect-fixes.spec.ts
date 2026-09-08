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
 * authorityCheckList 這一份來源，見 types/staff.ts 的說明。這裡驗證
 * 勾選／取消一個權限、儲存後，人員名單表格對應的 O/X 欄位會正確反映
 * （不是讀另一份沒有同步更新的欄位）。
 */
test('D-10：編輯人員權限只有一份來源，取消勾選後人員名單表格立刻反映', async ({ page }) => {
  // 編輯人員的對話框（6 個欄位＋16 格權限勾選網格）比預設視窗高，
  // ModalDialog 本身沒有另外處理內容超出視窗高度的捲動（見
  // components/ui/ModalDialog.vue）——這是既有的畫面問題，不是這裡
  // 要驗證的 D-10 本身，用大一點的視窗繞過，不掩蓋這個問題也不需要
  // 為了測試去改動畫面。
  await page.setViewportSize({ width: 1280, height: 1400 })
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('權限管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)

  // 選「James」這一列，開編輯視窗。
  await page.getByRole('row', { name: /James/ }).click()
  await page.getByRole('button', { name: '編輯', exact: true }).first().click()

  // 取消勾選「查看數據分析」（James 種子資料裡原本有這個權限）。
  const checkbox = page.getByRole('dialog').getByRole('checkbox', { name: '查看數據分析' })
  await expect(checkbox).toBeChecked()
  await checkbox.uncheck()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')

  // 人員名單表格的「查看數據分析」欄位應該立刻變成 X（不是讀一份
  // 沒有同步更新的舊欄位）。
  const jamesRow = page.getByRole('row', { name: /James/ })
  const columnIndex = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('th')).map((th) => th.textContent?.trim())
    return headers.indexOf('查看數據分析')
  })
  expect(columnIndex).toBeGreaterThan(-1)
  await expect(jamesRow.locator('td').nth(columnIndex)).toHaveText('X')
})
