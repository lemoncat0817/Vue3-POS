import { authorityKeySchema } from '@pos/contract'
import { createApp } from '../../src/app'
import { generateSecureToken, hashSecret } from '../../src/auth/hash'
import { issueOperatorSession } from '../../src/auth/operator-session'
import { devices, staff, users } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'
import { seedRole } from './roles'

export const TEST_PROVISIONING_SECRET = 'test-provisioning-secret'

export function createTestApp(db: AnyDb) {
  return createApp(db, {
    provisioningSecret: TEST_PROVISIONING_SECRET,
    allowedOrigins: ['http://localhost:4173'],
    frontendUrl: 'http://localhost:5173',
    googleClientId: 'test-google-client-id',
    googleClientSecret: 'test-google-client-secret',
    githubClientId: 'test-github-client-id',
    githubClientSecret: 'test-github-client-secret'
  })
}

async function seedTestStaff(
  db: AnyDb,
  tenantId: string | null
): Promise<{ staffId: string; sessionToken: string }> {
  const roleId = await seedRole(db, { capabilities: [...authorityKeySchema.options], tenantId })
  const staffId = crypto.randomUUID()
  await db.insert(staff).values({
    id: staffId,
    tenantId,
    name: '測試操作員',
    jobTitle: '測試',
    account: `test-staff-${staffId}`,
    roleId,
    pinHash: 'test-hash',
    pinSalt: 'test-salt'
  })
  const sessionToken = await issueOperatorSession(db, tenantId, staffId)
  return { staffId, sessionToken }
}

export async function issueTestSession(db: AnyDb, staffId: string): Promise<string> {
  return issueOperatorSession(db, null, staffId)
}

export async function createTestAppWithDevice(
  db: AnyDb,
  deviceName = 'test-device',
  options: { seedStaff?: boolean; tenantId?: string | null } = {}
): Promise<{
  app: ReturnType<typeof createApp>
  deviceToken: string
  staffId: string
  sessionToken: string
}> {
  const app = createTestApp(db)
  const tenantId = options.tenantId ?? null

  let deviceToken: string
  if (tenantId === null) {
    const res = await app.request('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provisioning-Secret': TEST_PROVISIONING_SECRET
      },
      body: JSON.stringify({ name: deviceName })
    })
    const body = (await res.json()) as { token: string }
    deviceToken = body.token
  } else {
    // 先確保租戶 user 存在以防外鍵約束失敗
    await db
      .insert(users)
      .values({
        id: tenantId,
        provider: 'google',
        providerAccountId: tenantId,
        email: `${tenantId}@example.com`,
        displayName: tenantId
      })
      .onConflictDoNothing()

    // 指定租戶之測試裝置直接寫入資料庫
    deviceToken = generateSecureToken()
    const { hash, salt } = await hashSecret(deviceToken)
    await db.insert(devices).values({
      id: crypto.randomUUID(),
      tenantId,
      name: deviceName,
      tokenHash: hash,
      tokenSalt: salt,
      createdAt: new Date().toISOString(),
      revokedAt: null
    })
  }

  const { staffId, sessionToken } =
    options.seedStaff === false ? { staffId: '', sessionToken: '' } : await seedTestStaff(db, tenantId)
  return { app, deviceToken, staffId, sessionToken }
}
