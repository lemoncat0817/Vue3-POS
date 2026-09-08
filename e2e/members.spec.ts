import { expect, test } from '@playwright/test'

/**
 * P22 迴歸驗證（規劃書 §10 P22「會員與顧客經營」）：
 *
 * - 後台會員管理可以新增／編輯／刪除會員，看得到消費紀錄。
 * - 結帳當下可以用手機號碼查會員（查無時可以直接建立），送單成功後
 *   依應付金額累加點數（見 apps/api/src/routes/orders.ts 的
 *   accrueMemberPoints，每 10 元 1 點）。
 *
 * 這裡用真正的 wrangler dev + 本機 D1 驗證，測試結束會刪除這個測試
 * 專用的會員，不留下需要下次執行前手動清掉的資料。
 */
test('結帳時查無會員可以直接建立，送單後依金額累加點數，後台看得到這筆消費紀錄', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  const phone = `09${Date.now().toString().slice(-8)}`
  const memberName = `P22測試會員-${Date.now()}`

  // 點一杯楊枝甘露2.0（80 元），結帳前先透過會員面板查詢／建立會員。
  await page.getByText('季節限定', { exact: true }).click()
  await page.getByText('楊枝甘露2.0', { exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()

  await page.getByTestId('member-button').click()
  await page.getByTestId('member-phone-input').fill(phone)
  await page.getByTestId('search-member').click()
  await page.getByTestId('new-member-name').fill(memberName)
  const createMemberResponse = page.waitForResponse(
    (res) => res.url().includes('/api/members') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByTestId('create-member').click()
  const memberBody = (await (await createMemberResponse).json()) as { id: string; name: string }
  await expect(page.getByTestId('toast-message')).toHaveText('會員建立成功')
  // 會員按鈕改顯示「會員：<名字>」，代表這筆訂單已經掛上這個會員。
  await expect(page.getByTestId('member-button')).toHaveText(`會員：${memberName}`)

  const createOrderResponse = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST' && res.ok(),
  )
  await page.getByTestId('checkout-button').click()
  await page.getByRole('button', { name: '現金', exact: true }).click()
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByRole('button', { name: '確認送出', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('訂單送出成功')
  await page.getByRole('button', { name: '繼續選取品項' }).click()
  const orderBody = (await (await createOrderResponse).json()) as { orderId: string; memberId: string; orderPaymentPrice: number }
  expect(orderBody.memberId).toBe(memberBody.id)
  expect(orderBody.orderPaymentPrice).toBe(80)

  // 會員面板送單後應該重置回未選狀態，不會延續給下一位客人。
  await expect(page.getByTestId('member-button')).toHaveText('會員')

  // 後台會員管理：看得到這個會員、點數（80 元 = 8 點）、這筆消費紀錄。
  await page.getByText('會員管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/members$/)
  const row = page.getByRole('row').filter({ hasText: memberName })
  await expect(row).toBeVisible()
  await expect(row).toContainText('8')

  await row.getByRole('button', { name: '消費紀錄', exact: true }).click()
  const detailDialog = page.getByRole('dialog', { name: `${memberName} 的消費紀錄` })
  await expect(detailDialog.getByText(orderBody.orderId)).toBeVisible()
  await expect(detailDialog.getByText('80 元')).toBeVisible()
  await detailDialog.getByRole('button', { name: '關閉' }).click()

  // 清掉這個測試專用的會員。
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/members/${memberBody.id}`) && res.request().method() === 'DELETE' && res.status() === 204,
  )
  await row.getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByText(memberName)).toHaveCount(0)
})

test('後台新增／編輯／刪除會員；重複的手機號碼會被擋', async ({ page }) => {
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)

  await page.getByText('會員管理', { exact: true }).click()
  await expect(page).toHaveURL(/\/members$/)

  const phone = `08${Date.now().toString().slice(-8)}`
  const name = `P22後台測試-${Date.now()}`

  await page.getByRole('button', { name: '新增會員', exact: true }).click()
  const addDialog = page.getByRole('dialog', { name: '新增會員' })
  await addDialog.getByLabel('姓名').fill(name)
  await addDialog.getByLabel('手機號碼').fill(phone)
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/members') && res.request().method() === 'POST' && res.ok(),
  )
  await addDialog.getByRole('button', { name: '新增', exact: true }).click()
  const created = (await (await createResponse).json()) as { id: string }
  await expect(page.getByTestId('toast-message')).toHaveText('新增成功')

  // 重複的手機號碼會被擋（前端 refine 即時檢查，不會送出請求）。
  await page.getByRole('button', { name: '新增會員', exact: true }).click()
  const addDialog2 = page.getByRole('dialog', { name: '新增會員' })
  await addDialog2.getByLabel('姓名').fill('另一個人')
  await addDialog2.getByLabel('手機號碼').fill(phone)
  await addDialog2.getByRole('button', { name: '新增', exact: true }).click()
  await expect(addDialog2.getByText('這個手機號碼已經是會員')).toBeVisible()
  await addDialog2.getByRole('button', { name: '取消', exact: true }).click()

  // 編輯改名字。
  const row = page.getByRole('row').filter({ hasText: name })
  const updatedName = `${name}-已編輯`
  await row.getByRole('button', { name: '編輯', exact: true }).click()
  const editDialog = page.getByRole('dialog', { name: '編輯會員' })
  await editDialog.getByLabel('姓名').fill(updatedName)
  await editDialog.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByTestId('toast-message')).toHaveText('保存成功')
  await expect(page.getByText(updatedName)).toBeVisible()

  // 清掉測試資料。
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes(`/api/members/${created.id}`) && res.request().method() === 'DELETE',
  )
  await page.getByRole('row').filter({ hasText: updatedName }).getByRole('button', { name: '刪除', exact: true }).click()
  await page.getByRole('button', { name: '確定' }).click()
  await deleteResponse
  await expect(page.getByText(updatedName)).toHaveCount(0)
})
