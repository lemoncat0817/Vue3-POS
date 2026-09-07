import { expect, test } from '@playwright/test'

/**
 * P3 迴歸驗證：修復 D-05。
 *
 * 舊版篩選用 `String.prototype.match(使用者輸入)`，字串會被當成正規
 * 表示式編譯——只要輸入「(」這種正規表示式特殊字元但語法不完整，
 * `match()` 就會丟出 SyntaxError，整個運算式中斷，訂單頁面直接白畫面。
 * 改用 `includes()`（單純子字串比對）之後，任何輸入都不會被當成正規
 * 表示式解析，這裡驗證輸入這類字元不會讓頁面掛掉，且篩選結果正確。
 */
test('訂單編號篩選輸入正規表示式特殊字元不會讓頁面出錯，且篩選結果正確', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  // 點一杯「楊枝甘露2.0」（不需選糖冰／容器大小）並送出訂單，讓訂單頁至少有一筆資料。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByRole('button', { name: '送出訂單' }).click()
  await page.getByRole('button', { name: '確定' }).click()
  // 預設付款方式為「紙鈔」現金，送出後彈出「應收取現金…」提示。
  await page.getByRole('button', { name: '收取現金' }).click()
  // P8：ElMessage 改用 Reka Toast（見 components/ui/ToastHost.vue 的
  // 說明），畫面上這則訊息用 testid 定位，避免跟 Reka 另外渲染的
  // aria-live 隱藏播報文字撞在一起。
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  // 送出後待付款清單歸零，會另外彈出「清單已清空」的通知（見 D-13 修復），
  // 要先關掉才能點側邊欄，不然點擊會被彈窗攔截。
  await page.getByRole('button', { name: '繼續選取品項' }).click()

  await page.getByText('查看訂單', { exact: true }).click()
  await expect(page).toHaveURL(/\/order$/)
  // P8：篩選欄位改成一次全部顯示（見 views/order/index.vue 的說明），
  // 不需要先點按鈕開啟彈出面板才能看到輸入框。
  const orderIdInput = page.getByPlaceholder('輸入訂單編號')
  const rows = page.getByTestId('order-row')
  // order store 內建 4 筆黃金資料集示範訂單（見 order.ts），加上剛送出
  // 的這一筆，總共 5 筆。
  await expect(rows).toHaveCount(5)

  // 觸發舊版 bug 的輸入：單獨一個「(」不是合法的正規表示式語法。
  await orderIdInput.fill('(')

  // 頁面不應該白畫面或拋出未捕捉例外，且篩選正確地找不到符合的訂單
  // （目前的訂單編號格式是純數字，不含括號）。
  await expect(page.getByText('目前無訂單')).toBeVisible()
  await expect(page.getByText('總共有')).toBeVisible()

  // 換成合法的子字串（黃金資料集訂單編號共同前綴），確認篩選本身的邏輯
  // 仍然正確，不是只是「不會壞掉」。
  await orderIdInput.fill('202406')
  await expect(rows).toHaveCount(4)

  // 清空篩選後，全部訂單要能恢復顯示，確認頁面狀態沒有被破壞。
  await page.getByRole('button', { name: '重置篩選' }).click()
  await expect(rows).toHaveCount(5)
})
