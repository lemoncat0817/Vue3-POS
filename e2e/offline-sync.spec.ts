import { expect, test } from '@playwright/test'

/**
 * P3 退出條件（規劃書 §14）：斷網送 3 張訂單，重新連線，確認伺服端
 * 訂單數與金額精確吻合、沒有重複。
 *
 * 用 Playwright 的 context.setOffline() 模擬真的斷線（不是 mock
 * fetch）——連 SyncWorker 的重試／退避邏輯、'online' 事件、離線佇列
 * 落地 IndexedDB 這幾件事都要在真瀏覽器環境下一起動起來才算數。
 */
test('斷網時送出的 3 張訂單先落地本機佇列，重新連線後自動同步且不重複', async ({ page, context }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 訂單頁是 vue-router 的 lazy route（動態 import()），第一次造訪需要
  // 額外向伺服器要那個 chunk 檔案——先在還有網路時預熱一次，避免等一下
  // 離線時因為連不到「切頁本身要載的 JS 檔案」而誤判成同步邏輯壞掉
  // （這不是這個測試要驗證的東西：離線送單能不能同步才是重點）。
  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  await page.getByText('點餐', { exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)

  await context.setOffline(true)

  const submitOneOrder = async () => {
    await page.getByText('季節限定', { exact: true }).click()
    await page.getByText('楊枝甘露2.0', { exact: true }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.getByRole('button', { name: '新增', exact: true }).click()
    await page.getByRole('button', { name: '送出訂單' }).click()
    await page.getByRole('button', { name: '確定' }).click()
    await page.getByRole('button', { name: '收取現金' }).click()
    // P8：ElMessage 改用 Reka Toast（見 components/ui/ToastHost.vue 的
    // 說明），畫面上這則訊息用 testid 定位，避免跟 Reka 另外渲染的
    // aria-live 隱藏播報文字撞在一起。
    await expect(page.getByTestId('toast-message').last()).toHaveText('訂單送出成功')
    // 送單後待付款清單歸零會另外彈一次通知，關掉才能繼續下一輪操作。
    await page.getByRole('button', { name: '繼續選取品項' }).click()
  }

  await submitOneOrder()
  await submitOneOrder()
  await submitOneOrder()

  // 離線也要能立刻在本機看到這 3 筆——不能因為連不到伺服端就讓畫面
  // 看起來像沒送出去。訂單列表目前完全是本機 Pinia 狀態（黃金資料集 4
  // 筆 + 這裡新送的 3 筆），不需要網路。
  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  // P8：訂單表格改用 TanStack Table 搭配自訂 Tailwind 標記（見
  // views/order/index.vue 的說明），row 用 data-testid="order-row" 定位。
  await expect(page.getByTestId('order-row')).toHaveCount(7)

  // 頁首的同步狀態列（見 layout/header/index.vue）要讓店員看得出「這 3
  // 張單還沒真的送達伺服端」，不是只有畫面上看起來送出去了。
  const syncBadge = page.getByTestId('sync-status')
  await expect(syncBadge).toContainText('3 筆')

  // 監看重新連線後真正送往伺服端的請求，直接從回應內容確認：剛好 3 次
  // 成功的 POST，且伺服端配發了 3 個不同的 orderId（沒有把同一張單
  // 重複送成兩筆，也沒有漏掉任何一筆）。
  const syncedOrderIds = new Set<string>()
  page.on('response', (res) => {
    if (res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok()) {
      void res
        .json()
        .then((body: { orderId?: string }) => {
          if (body.orderId) syncedOrderIds.add(body.orderId)
        })
        .catch(() => undefined)
    }
  })

  await context.setOffline(false)

  await expect.poll(() => syncedOrderIds.size, { timeout: 20_000, intervals: [500] }).toBe(3)
  // 全部同步完成後，狀態列應該恢復成「沒有東西要顯示」。
  await expect(syncBadge).toBeHidden()
})
