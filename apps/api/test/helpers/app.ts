import { createApp } from '../../src/app'
import type { AnyDb } from '../../src/db/types'

/** 測試用的核發密鑰（見 middleware/require-provisioning-secret.ts）。 */
export const TEST_PROVISIONING_SECRET = 'test-provisioning-secret'

export function createTestApp(db: AnyDb) {
  return createApp(db, { provisioningSecret: TEST_PROVISIONING_SECRET, allowedOrigins: ['http://localhost:4173'] })
}

/**
 * requireDeviceToken（見 src/middleware/require-device-token.ts）現在
 * 真的查 devices 表，測試需要一個裝置憑證時，得先透過核發端點真的建立
 * 一台裝置，不能再用寫死的固定字串。
 */
export async function createTestAppWithDevice(
  db: AnyDb,
  deviceName = 'test-device',
): Promise<{ app: ReturnType<typeof createApp>; deviceToken: string }> {
  const app = createTestApp(db)
  const res = await app.request('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Provisioning-Secret': TEST_PROVISIONING_SECRET },
    body: JSON.stringify({ name: deviceName }),
  })
  const body = (await res.json()) as { token: string }
  return { app, deviceToken: body.token }
}
