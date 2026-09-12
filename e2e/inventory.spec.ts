import { expect, test } from '@playwright/test'

// 驗證庫存追蹤、樂觀扣庫存與缺貨停售。使用專用動態品項避免平行測試干擾。
test('後台設定品項庫存為 0 後，點餐頁把這個品項標成缺貨且無法選取；送單成功會扣庫存', async ({
  page
}) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const categoryName = `P20庫存測試-${Date.now()}`
  const itemName = `P20測試品項-${Date.now()}`

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByRole('button', { name: '分類', exact: true }).click()

  const createCategoryResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/catalog/categories') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByRole('button', { name: '＋ 新增分類', exact: true }).click()
  const addCategoryDialog = page.getByRole('dialog', { name: '新增分類' })
  await addCategoryDialog.getByPlaceholder('例如: 主餐、飲品...').fill(categoryName)
  await addCategoryDialog.getByRole('button', { name: '新增', exact: true }).click()
  const categoryBody = (await (await createCategoryResponse).json()) as { id: string }

  await page.getByRole('button', { name: '品項', exact: true }).click()
  const createItemResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/catalog/products') && res.request().method() === 'POST' && res.ok()
  )
  await page.getByRole('button', { name: '＋ 新增品項', exact: true }).click()
  const addProductDialog = page.getByRole('dialog', { name: '新增品項' })
  await addProductDialog.getByPlaceholder('例如: 招牌牛肉漢堡...').fill(itemName)
  await addProductDialog.getByLabel('分類').selectOption({ label: categoryName })
  await addProductDialog.getByPlaceholder('純數字').fill('50')
  await addProductDialog.getByPlaceholder('留空代表不追蹤庫存').fill('1')
  await addProductDialog.getByRole('button', { name: '新增', exact: true }).click()
  const itemBody = (await (await createItemResponse).json()) as { id: string; stock: number | null }
  expect(itemBody.stock).toBe(1)
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')

  await page.getByRole('button', { name: '點餐', exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText(categoryName, { exact: true }).click()
  await page.getByText(itemName, { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')

  await page.getByText(categoryName, { exact: true }).click()
  const soldOutTile = page
    .locator('div')
    .filter({ hasText: itemName })
    .filter({ hasText: '缺貨' })
    .first()
  await expect(soldOutTile).toBeVisible()
  await soldOutTile.click()
  await expect(soldOutTile).not.toHaveClass(/border-primary-500/)

  // 品項清單無篩選，新品項可能不在預設頁，改以 API 直接驗證庫存已扣至 0。
  const catalogAfterOrder = await page.request.get('http://localhost:8787/api/catalog')
  const catalogAfterOrderBody = (await catalogAfterOrder.json()) as {
    products: { id: string; stock: number | null }[]
  }
  expect(catalogAfterOrderBody.products.find((p) => p.id === itemBody.id)?.stock).toBe(0)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByRole('button', { name: '品項', exact: true }).click()

  // 新品項排在清單最後，種子資料已超過一頁時需翻到下一頁才看得到。
  const productRow = page.getByRole('row', { name: itemName })
  if ((await productRow.count()) === 0) {
    await page.getByRole('button', { name: '下一頁' }).click()
  }
  const deleteItemResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/catalog/products/${itemBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204
  )
  await productRow.getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteItemResponse

  await page.getByRole('button', { name: '分類', exact: true }).click()
  const deleteCategoryResponse = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/catalog/categories/${categoryBody.id}`) &&
      res.request().method() === 'DELETE' &&
      res.status() === 204
  )
  await page
    .getByRole('row', { name: categoryName })
    .getByRole('button', { name: '刪除', exact: true })
    .click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteCategoryResponse
})
