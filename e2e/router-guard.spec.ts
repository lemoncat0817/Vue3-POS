import { expect, test } from '@playwright/test'

// 驗證路由守衛權限控管與重新整理後狀態還原。
test('重新整理頁面會還原到上次瀏覽的頁籤（D-12：不用手動維護頁籤狀態）', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('後台設定', { exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)

  await page.reload()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
})

test('沒有權限的分頁會被導航守衛擋下並提示錯誤（D-11）', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('emily')
  await page.getByPlaceholder('請輸入 PIN').fill('3456')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('數據分析', { exact: true }).click()

  await expect(page.getByText('您沒有權限訪問該頁面')).toBeVisible()
  await expect(page).toHaveURL(/\/home$/)
})
