import { test as setup } from '@playwright/test'
import { authFile } from './auth-file'

// e2e 測試用的裝置憑證：改成登入後才核發（見 apps/pos/src/api/oauth.ts），
// 不再是 build-time 塞進前端的 VITE_DEVICE_TOKEN，e2e 沒辦法真的走一次
// Google／GitHub 登入，改成這裡直接呼叫核發端點換一組裝置 token，
// 用 storageState 塞進 localStorage（key 是 stores/device.ts 的 store id
// 'device'，格式對應 pinia-plugin-persistedstate 的預設序列化方式），
// 讓每個測試一開始就跟真的登入過一樣。這組裝置沒有指定租戶
// （tenantId 為 null，見 routes/devices.ts），跟 seed/staff.sql 那份
// lemon／james／emily 示範帳號同一個「未分配租戶」過渡池，e2e 測試
// 本來就是針對這份資料寫的。

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:8787'
const PROVISIONING_SECRET = process.env.PROVISIONING_SECRET ?? 'dev-provisioning-secret'

setup('配對 e2e 測試用的裝置憑證', async ({ page, baseURL }) => {
  const res = await fetch(`${API_BASE_URL}/api/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Provisioning-Secret': PROVISIONING_SECRET },
    body: JSON.stringify({ name: 'e2e-test-device' })
  })
  if (!res.ok) {
    throw new Error(`核發 e2e 裝置憑證失敗：HTTP ${res.status}，確認 API dev server 有跑起來`)
  }
  const { token } = (await res.json()) as { token: string }

  // 先真的導頁一次，localStorage 才有 origin 可以寫入。
  await page.goto(baseURL ?? '/')
  await page.evaluate((deviceToken) => {
    localStorage.setItem('device', JSON.stringify({ deviceToken }))
  }, token)

  await page.context().storageState({ path: authFile })
})
