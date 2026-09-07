import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

/**
 * 最小可行的裝置層級防護：比對 `X-Device-Token` 標頭與設定值是否相符。
 *
 * 這不是重構規劃書 §9 規劃的完整身分系統（裝置憑證＋操作員 PIN 授權包）
 * ——那是 P4 的範圍。這裡先用單一固定字串，只為了讓「有動作會被拒絕」
 * 在 P2 就是可以測試、真實存在的行為，而不是等 P4 才第一次出現權限
 * 檢查。之後 P4 會直接取代這個中介層，不會疊加在上面。
 */
export const requireDeviceToken = createMiddleware<AppEnv>(async (c, next) => {
  const provided = c.req.header('X-Device-Token')
  if (!provided || provided !== c.get('deviceToken')) {
    return c.json({ error: '裝置憑證無效或缺漏' }, 401)
  }
  await next()
})
