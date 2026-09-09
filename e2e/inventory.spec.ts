import { expect, test } from '@playwright/test'

// 驗證庫存追蹤、樂觀扣庫存與缺貨停售。使用專用動態品項避免平行測試干擾。
test('後台設定品項庫存為 0 後，點餐頁把這個品項標成缺貨且無法選取；送單成功會扣庫存', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const typeName = `P20庫存測試-${Date.now()}`
  const typeCode = `p20Stock${Date.now()}`
  const itemName = `P20測試品項-${Date.now()}`

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
  await addDrinkDialog.getByText('請選擇飲料的客製化設定').click()
  await page.getByRole('option', { name: '無客製化，容器限大杯' }).click()
  await addDrinkDialog.getByPlaceholder('留空代表不追蹤庫存').fill('1')
  await addDrinkDialog.getByRole('button', { name: '新增', exact: true }).click()
  const itemBody = (await (await createItemResponse).json()) as { id: string; stock: number | null }
  expect(itemBody.stock).toBe(1)
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')

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

  await page.getByText(typeName, { exact: true }).click()
  const soldOutTile = page.locator('div').filter({ hasText: itemName }).filter({ hasText: '缺貨' }).first()
  await expect(soldOutTile).toBeVisible()
  await soldOutTile.click()
  await expect(soldOutTile).not.toHaveClass(/border-primary-500/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByText(typeName, { exact: true }).click()
  await expect(page.getByRole('cell', { name: '缺貨', exact: true })).toBeVisible()

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
