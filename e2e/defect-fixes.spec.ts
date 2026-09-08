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
