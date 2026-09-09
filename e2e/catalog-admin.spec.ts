import { expect, test } from '@playwright/test'

// 驗證後台商品管理對伺服端 API 的 CRUD 操作與狀態持久化。
test('後台新增／刪除分類會真的呼叫伺服端，重新整理後狀態一致', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByRole('button', { name: '分類', exact: true }).click()

  const categoryName = `E2E測試分類-${Date.now()}`

  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/catalog/categories') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByRole('button', { name: '＋ 新增分類', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增分類' })
  await addDialog.getByPlaceholder('例如: 主餐、飲品...').fill(categoryName)
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()

  const createBody = (await (await createResponse).json()) as { id: string; name: string }
  expect(createBody).toMatchObject({ name: categoryName })
  expect(createBody.id).toMatch(/^[0-9a-f-]{36}$/)

  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')
  await expect(page.getByText(categoryName)).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByRole('button', { name: '分類', exact: true }).click()
  await expect(page.getByText(categoryName)).toBeVisible()

  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/catalog/categories/${createBody.id}`) && res.request().method() === 'DELETE' && res.status() === 204,
  )
  await page.getByRole('row', { name: categoryName }).getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByTestId('toast-message')).toHaveText('刪除成功')
  await expect(page.getByText(categoryName)).toHaveCount(0)

  await page.reload()
  await page.getByRole('button', { name: '後台設定', exact: true }).click()
  await page.getByRole('button', { name: '商品管理', exact: true }).click()
  await page.getByRole('button', { name: '分類', exact: true }).click()
  await expect(page.getByText(categoryName)).toHaveCount(0)
})
