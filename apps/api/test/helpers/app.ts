import { createApp } from '../../src/app'
import type { AnyDb } from '../../src/db/types'

/** 測試用的固定裝置憑證，搭配 test/helpers/db.ts 的資料庫使用。 */
export const TEST_DEVICE_TOKEN = 'test-device-token'

export function createTestApp(db: AnyDb) {
  return createApp(db, { deviceToken: TEST_DEVICE_TOKEN })
}
