import { expect, test } from '@playwright/test'

/**
 * P14 迴歸驗證（規劃書 §10 P0「掛單取單」）：把還沒送出的購物車暫存
 * 起來、清空工作區去服務下一位客人，稍後可以取單繼續——掛單只存在
 * 本機 Dexie（見 apps/pos/src/offline/db.ts 的 ParkedOrder 說明），
 * 不是一筆真正的訂單，這裡不需要 wrangler dev，純前端驗證。
 */
test('掛單後購物車清空，取單能把品項與備註原封不動地拿回來', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 點一杯「楊枝甘露2.0」。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await expect(page.getByText('目前無待付款的飲品')).toHaveCount(0)

  // 掛單，附上備註。
  await page.getByTestId('parked-orders-button').click()
  await page.getByPlaceholder('備註（選填，例如：3號桌、王小姐）').fill('3號桌')
  await page.getByTestId('park-current-order').click()
  await expect(page.getByTestId('toast-message')).toHaveText('已掛單')

  // 對話框還開著：應該看到剛剛掛的那一筆，購物車已經清空。
  await expect(page.getByTestId('parked-order-row')).toHaveCount(1)
  await expect(page.getByTestId('parked-order-row')).toContainText('3號桌')
  await expect(page.getByTestId('parked-orders-button')).toContainText('（1）')
  await page.getByRole('button', { name: '關閉' }).click()
  await expect(page.getByText('目前無待付款的飲品')).toBeVisible()

  // 取單：品項應該原封不動地回到購物車。
  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('parked-order-row').getByRole('button', { name: '取單', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('已取單')
  // resumeOrder() 成功後會自己把對話框關掉（見 ParkedOrdersPanel.vue
  // 的說明），不需要在這裡另外關閉。
  await expect(page.getByTestId('cart-row')).toContainText('楊枝甘露2.0')
  await expect(page.getByText('目前無待付款的飲品')).toHaveCount(0)

  // 掛單清單應該已經清空（取單後移除那一筆）。
  await page.getByTestId('parked-orders-button').click()
  await expect(page.getByText('目前沒有掛單')).toBeVisible()
})

test('取單時目前購物車還有品項，需要確認才會覆蓋', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 點一杯，掛單。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('park-current-order').click()
  await expect(page.getByTestId('toast-message')).toHaveText('已掛單')
  await page.getByRole('button', { name: '關閉' }).click()

  // 再點一杯（同一款即可，這裡只驗證覆蓋確認流程，不是品項本身），
  // 購物車現在非空。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  // 取單應該先跳確認框。
  await page.getByTestId('parked-orders-button').click()
  await page.getByTestId('parked-order-row').getByRole('button', { name: '取單', exact: true }).click()
  await expect(page.getByText('目前待付款清單還有品項，取單會覆蓋目前清單，是否繼續？')).toBeVisible()
  await page.getByRole('button', { name: '繼續取單' }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('已取單')
})
