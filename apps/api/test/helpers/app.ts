import { authorityKeySchema } from '@pos/contract'
import { createApp } from '../../src/app'
import { staff } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'
import { seedRole } from './roles'

/** 測試用的核發密鑰（見 middleware/require-provisioning-secret.ts）。 */
export const TEST_PROVISIONING_SECRET = 'test-provisioning-secret'

export function createTestApp(db: AnyDb) {
  return createApp(db, { provisioningSecret: TEST_PROVISIONING_SECRET, allowedOrigins: ['http://localhost:4173'] })
}

/**
 * 測試用操作員：角色擁有全部權限，通得過 requireCapability()（見
 * src/middleware/require-capability.ts）的檢查。多數測試只在乎「有一個
 * 帳號能執行任何寫入操作」，需要驗證「權限不足會被擋下」的測試才會另外
 * 自己 seedRole() 一個能力較少的角色與員工。
 */
async function seedTestStaff(db: AnyDb): Promise<string> {
  const roleId = await seedRole(db, { capabilities: [...authorityKeySchema.options] })
  const staffId = crypto.randomUUID()
  await db.insert(staff).values({
    id: staffId,
    name: '測試操作員',
    jobTitle: '測試',
    account: `test-staff-${staffId}`,
    roleId,
    pinHash: 'test-hash',
    pinSalt: 'test-salt',
  })
  return staffId
}

/**
 * requireDeviceToken（見 src/middleware/require-device-token.ts）現在
 * 真的查 devices 表，測試需要一個裝置憑證時，得先透過核發端點真的建立
 * 一台裝置，不能再用寫死的固定字串。同時附上一個全權限的操作員，讓需要
 * X-Staff-Id 才能通過的寫入端點（見 require-capability.ts）也能直接呼叫。
 *
 * `seedStaff: false` 跳過這個自動附掛的操作員：驗證「全店最後一位權限
 * 管理者」這種不可歸零保護的測試，需要精準控制 db 裡有誰、有什麼權限，
 * 多一個全權限的操作員會讓「歸零」條件永遠不成立，見 staff.spec.ts／
 * roles.spec.ts 裡「此變更會讓沒有人擁有設定權限群組的權限時拒絕」等測試。
 */
export async function createTestAppWithDevice(
  db: AnyDb,
  deviceName = 'test-device',
  options: { seedStaff?: boolean } = {},
): Promise<{ app: ReturnType<typeof createApp>; deviceToken: string; staffId: string }> {
  const app = createTestApp(db)
  const res = await app.request('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Provisioning-Secret': TEST_PROVISIONING_SECRET },
    body: JSON.stringify({ name: deviceName }),
  })
  const body = (await res.json()) as { token: string }
  const staffId = options.seedStaff === false ? '' : await seedTestStaff(db)
  return { app, deviceToken: body.token, staffId }
}
