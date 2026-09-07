import { expect, test } from '@playwright/test'

/**
 * P6 迴歸驗證：訂單列表頁「編輯訂單狀態」／「刪除訂單」改成真的呼叫
 * apps/api（見 apps/pos/src/views/order/index.vue、api/orders.ts 的
 * 說明），不再只是改本機 Pinia 狀態。這裡對真正的 wrangler dev + 本機
 * D1 驗證：改狀態、刪除都真的送出對應的 PATCH／DELETE 請求，且伺服端
 * 回應成功後畫面才更新。
 */
test('編輯訂單狀態與刪除訂單會真的呼叫伺服端', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 送一筆真的訂單，等它同步到伺服端（拿到伺服端配發的正式 orderId，
  // 見 stores/order.ts 的 reconcileOrderId 說明）——這兩個操作都要求
  // 訂單已經存在於伺服端，用本機還沒同步過的假 orderId 會收到 404。
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByRole('button', { name: '送出訂單' }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await page.getByRole('button', { name: '收取現金' }).click()
  await expect(page.getByText('訂單送出成功')).toBeVisible()
  // 送單後待付款清單歸零會另外彈一次通知，關掉才能繼續點側邊欄。
  await page.getByRole('button', { name: '繼續選取品項' }).click()
  const createBody = (await (await createResponse).json()) as { orderId: string }

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  const row = page.locator('.el-table__row', { hasText: createBody.orderId })
  await expect(row).toBeVisible()

  // 編輯訂單狀態 → 選「已取消」（點取消按鈕，見 editOrderStatus 的說明）。
  const statusResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/orders/${createBody.orderId}/status`) &&
      res.request().method() === 'PATCH' &&
      res.ok(),
  )
  await row.getByRole('button', { name: '編輯訂單狀態' }).click()
  await page.getByRole('button', { name: '已取消', exact: true }).click()
  const statusBody = (await (await statusResponse).json()) as { orderStatus: string }
  expect(statusBody.orderStatus).toBe('已取消')
  await expect(page.getByText('訂單狀態已設定為已取消')).toBeVisible()
  await expect(row).toContainText('已取消')

  // 刪除訂單，確認畫面上這一列真的消失，且是等伺服端回應成功才消失。
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/orders/${createBody.orderId}`) && res.request().method() === 'DELETE',
  )
  await row.getByRole('button', { name: '刪除訂單' }).click()
  await page.getByRole('button', { name: '確定' }).click()
  const deleteRes = await deleteResponse
  expect(deleteRes.status()).toBe(204)
  await expect(page.getByText('刪除成功')).toBeVisible()
  await expect(page.locator('.el-table__row', { hasText: createBody.orderId })).toHaveCount(0)
})
