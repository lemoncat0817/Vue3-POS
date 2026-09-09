import { expect, test } from '@playwright/test'
import path from 'path'

const artifactDir = '/home/jim/.gemini/antigravity-ide/brain/694ba1b5-4d63-43cf-93be-11a85f734d9e'

test('Visual verification across viewports and dark mode without layout breaking', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('login')
  await page.getByPlaceholder('請輸入帳號').fill('lemon')
  await page.getByPlaceholder('請輸入 PIN').fill('1234')
  await page.getByRole('button', { name: '登入' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await page.waitForTimeout(1000)

  const toastClose = page.getByRole('button', { name: /close|關閉/i }).or(page.locator('.toast-close, [aria-label="Close"]'))
  if (await toastClose.count() > 0) {
    await toastClose.first().click().catch(() => {})
  }

  await page.getByRole('button', { name: /原味茶/ }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /翡翠綠茶/ }).click()
  await page.waitForTimeout(300)

  await page.getByRole('button', { name: '無糖', exact: true }).click()
  await page.getByRole('button', { name: '去冰', exact: true }).click()
  await page.getByRole('button', { name: 'L杯', exact: true }).click()
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.waitForTimeout(200)

  await expect(page.getByText('NT$ NaN')).toHaveCount(0)

  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.waitForTimeout(300)

  await page.screenshot({ path: path.join(artifactDir, 'pos_home_1440.png') })

  const checkoutBtn = page.getByTestId('checkout-button')
  await expect(checkoutBtn).toBeVisible()
  const box1440 = await checkoutBtn.boundingBox()
  expect(box1440).not.toBeNull()
  if (box1440) {
    expect(box1440.y + box1440.height).toBeLessThanOrEqual(900)
  }

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(artifactDir, 'pos_home_1280.png') })
  const box1280 = await checkoutBtn.boundingBox()
  expect(box1280).not.toBeNull()
  if (box1280) {
    expect(box1280.y + box1280.height).toBeLessThanOrEqual(800)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  const themeToggle = page.locator('button[aria-label*="模式"]')
  await themeToggle.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(artifactDir, 'pos_home_dark_1440.png') })

  await page.getByRole('button', { name: '查看訂單' }).click()
  await expect(page).toHaveURL(/\/order$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_order_dark.png') })

  await page.getByRole('button', { name: '後台設定' }).click()
  const confirmBtn = page.getByRole('button', { name: '確定前往' })
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click()
  }
  await expect(page).toHaveURL(/\/backgroundSetting$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_background_setting_dark.png') })

  await page.getByText('優惠設定', { exact: true }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_background_setting_offers_dark.png') })

  await page.getByRole('button', { name: '數據分析' }).click()
  await expect(page).toHaveURL(/\/dataAnalysis$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_data_analysis_dark.png') })

  await page.getByRole('button', { name: '權限管理' }).click()
  await expect(page).toHaveURL(/\/authorityManagement$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_authority_dark.png') })

  await page.getByRole('button', { name: '會員管理' }).click()
  await expect(page).toHaveURL(/\/members$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_members_dark.png') })

  await page.getByRole('button', { name: '桌況管理' }).click()
  await expect(page).toHaveURL(/\/tables$/)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'pos_tables_dark.png') })
})
