import { expect, test } from '@playwright/test'

/**
 * P20 迴歸驗證（規劃書 §10 P20「基礎庫存管理」）：
 *
 * - 後台商品管理可以設定品項的庫存，留空代表不追蹤。
 * - 送單成功後扣庫存——訂單是先進本機離線佇列、背景非同步送到伺服端
 *   才真的扣庫存（見 views/home/index.vue 的 submitPayment 說明），
 *   這裡先在本機樂觀扣減，讓點餐頁能立刻看到「賣完了」，伺服端那份
 *   也會各自獨立扣到同樣的結果，兩邊不會扣兩次或扣不到。
 * - 庫存扣到 0 之後，點餐頁會把這個品項標成缺貨，擋掉繼續選取。
 *
 * 這裡新建一個專用的飲品類型／品項（而不是沿用種子資料裡「楊枝甘露
 * 2.0」這種其他 e2e 測試也會點的共用品項）——庫存欄位會被這個測試
 * 改到 0，其他跟送單有關的測試如果剛好在同一批平行測試裡選到同一個
 * 缺貨品項，會被畫面上的 `pointer-events-none` 擋下點擊，整個測試卡
 * 住直到逾時（實際發生過，不是假設性的）。專用的類型／品項用完即刪，
 * 不會留下需要在下次執行前手動清掉的資料。
 */
test('後台設定品項庫存為 0 後，點餐頁把這個品項標成缺貨且無法選取；送單成功會扣庫存', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const typeName = `P20庫存測試-${Date.now()}`
  const typeCode = `p20Stock${Date.now()}`
  const itemName = `P20測試品項-${Date.now()}`

  // 建一個專用的飲品類型＋品項，庫存設成 1。
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '商品管理', exact: true }).click()

  const createGroupResponse = page.waitForResponse(
    (res) => res.url().includes('/api/catalog/groups') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '新增', exact: true }).first().click()
  const addTypeDialog = page.getByRole('dialog', { name: '新增飲品類型' })
  await addTypeDialog.getByPlaceholder('例如: 原味茶,芝芝系列...').fill(typeName)
  await addTypeDialog.getByPlaceholder('例如: drinkMilk...').fill(typeCode)
  await addTypeDialog.getByRole('button', { name: '新增', exact: true }).click()
  const groupBody = (await (await createGroupResponse).json()) as { id: string }

  await page.getByText(typeName, { exact: true }).click()
  const createItemResponse = page.waitForResponse(
    (res) => res.url().includes('/api/catalog/items') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '新增', exact: true }).nth(1).click()
  const addDrinkDialog = page.getByRole('dialog', { name: '新增飲料品項' })
  await addDrinkDialog.getByPlaceholder('例如: 芝芝金萱,金萱雙Q...').fill(itemName)
  await addDrinkDialog.getByPlaceholder('無此容器，請關左側開關').first().fill('50')
  // 這個品項不需要瓶裝——關掉瓶裝開關，跟客製化選「無」保持一致
  // （見 productManagement/index.vue 的說明：無客製化時容器僅限大杯）。
  await addDrinkDialog.getByText('請選擇飲料的客製化設定').click()
  await page.getByRole('option', { name: '無客製化，容器限大杯' }).click()
  await addDrinkDialog.getByPlaceholder('留空代表不追蹤庫存').fill('1')
  await addDrinkDialog.getByRole('button', { name: '新增', exact: true }).click()
  const itemBody = (await (await createItemResponse).json()) as { id: string; stock: number | null }
  expect(itemBody.stock).toBe(1)
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')

  // 點餐頁：庫存還有 1，這個品項可以正常選取、加入購物車、送單。
  await page.getByRole('button', { name: '點餐', exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText(typeName, { exact: true }).click()
  await page.getByText(itemName, { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()

  // 送單當下已經在本機樂觀扣過庫存（1 - 1 = 0），點餐頁應該立刻看到
  // 這個品項變成缺貨，不需要重新整理或等下一次伺服端同步。
  await page.getByText(typeName, { exact: true }).click()
  const soldOutTile = page.locator('div').filter({ hasText: itemName }).filter({ hasText: '缺貨' }).first()
  await expect(soldOutTile).toBeVisible()
  await soldOutTile.click()
  // 沒有被選取——選取後會加上 border-primary-500 這個 class，點擊缺貨
  // 品項不應該套用。
  await expect(soldOutTile).not.toHaveClass(/border-primary-500/)

  // 後台商品管理這一格也應該顯示「缺貨」。
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByText(typeName, { exact: true }).click()
  await expect(page.getByRole('cell', { name: '缺貨', exact: true })).toBeVisible()

  // 清掉這個測試專用的類型（刪除類型前必須先清空底下的品項，見
  // catalog-admin.spec.ts、routes/catalog.ts 的 409 說明）。
  await page.getByText(itemName, { exact: true }).click()
  const deleteItemResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/catalog/items/${itemBody.id}`) && res.request().method() === 'DELETE' && res.status() === 204,
  )
  await page.getByRole('button', { name: '刪除', exact: true }).nth(1).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteItemResponse

  await page.getByText(typeName, { exact: true }).click()
  const deleteGroupResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/catalog/groups/${groupBody.id}`) && res.request().method() === 'DELETE' && res.status() === 204,
  )
  await page.getByRole('button', { name: '刪除', exact: true }).first().click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteGroupResponse
})
