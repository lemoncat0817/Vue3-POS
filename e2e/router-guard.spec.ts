import { expect, test } from '@playwright/test'

/**
 * P7（D-11／D-12）真實瀏覽器驗證。單元測試（src/router/index.spec.ts）
 * 已經涵蓋守衛邏輯本身，這裡驗證的是單元測試測不到的部分：pageStore 用
 * pinia-plugin-persistedstate 存進真正的 localStorage，「重新整理後還原
 * 上次頁籤」這件事只有在真的重新整理瀏覽器分頁時才會真的走到
 * router.beforeEach 的「應用程式剛啟動」分支（見 router/index.ts）。
 */
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
  // emily（工讀生）沒有查看數據分析／權限管理的權限（見 apps/api/seed/staff.sql）。
  await page.getByPlaceholder('請輸入帳號').fill('emily')
  await page.getByPlaceholder('請輸入 PIN').fill('3456')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('數據分析', { exact: true }).click()

  await expect(page.getByText('您沒有權限訪問該頁面')).toBeVisible()
  await expect(page).toHaveURL(/\/home$/)
})
