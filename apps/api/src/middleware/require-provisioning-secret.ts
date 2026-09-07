import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

/**
 * 核發裝置憑證（POST /api/devices）本身要防護，但不能用裝置憑證來
 * 防護它——你要核發的正是「還沒有裝置憑證的那台新終端機」，用
 * requireDeviceToken 會變成先有雞還是先有蛋的問題。這裡用另一把獨立的
 * 密鑰（PROVISIONING_SECRET），只給店主／設定者在建置初期使用，日常
 * 營運不會用到。
 */
export const requireProvisioningSecret = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Provisioning-Secret')
  if (!provided || provided !== c.get('provisioningSecret')) {
    return c.json({ error: '核發密鑰無效或缺漏' }, 401)
  }
  await next()
})
