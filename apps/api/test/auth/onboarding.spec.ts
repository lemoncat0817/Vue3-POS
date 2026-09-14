import { describe, expect, it } from 'vitest'
import { sha256Hex, verifySecret, verifyToken } from '../../src/auth/hash'
import { ensureTenantOnboarded, provisionDeviceForLogin } from '../../src/auth/onboarding'
import {
  categories,
  devices,
  diningTables,
  invoiceTracks,
  orderCoupons,
  paymentMethods,
  products,
  quickDiscounts,
  roles,
  staff,
  users
} from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'
import { createTestDb } from '../helpers/db'

/** devices／staff…等表的 tenantId 是外鍵指到 users.id（見 db/schema.ts），
 *  onboarding 前要先有這個租戶的 users 列存在，不然會撞 FOREIGN KEY constraint。 */
async function seedTenantUser(db: AnyDb, tenantId: string) {
  await db.insert(users).values({
    id: tenantId,
    provider: 'google',
    providerAccountId: tenantId,
    email: `${tenantId}@example.com`,
    displayName: tenantId,
    createdAt: new Date().toISOString()
  })
}

describe('ensureTenantOnboarded', () => {
  it('第一次登入會灌好角色／owner 員工／菜單／付款方式／促銷／字軌／桌況，並回傳一次性的 owner 帳密', async () => {
    const db = createTestDb()
    await seedTenantUser(db, 'tenant-1')
    const result = await ensureTenantOnboarded(db, 'tenant-1')
    expect(result).not.toBeNull()
    expect(result?.ownerAccount).toMatch(/^owner-/)
    expect(result?.ownerPin).toMatch(/^\d{4}$/)

    const [roleRows, staffRows, catalogRows, productRows, paymentRows, couponRows, discountRows, trackRows, tableRows] =
      await Promise.all([
        db.select().from(roles).all(),
        db.select().from(staff).all(),
        db.select().from(categories).all(),
        db.select().from(products).all(),
        db.select().from(paymentMethods).all(),
        db.select().from(orderCoupons).all(),
        db.select().from(quickDiscounts).all(),
        db.select().from(invoiceTracks).all(),
        db.select().from(diningTables).all()
      ])

    expect(roleRows).toHaveLength(3)
    expect(roleRows.every((r) => r.tenantId === 'tenant-1')).toBe(true)
    expect(staffRows).toHaveLength(1)
    expect(staffRows[0]?.account).toBe(result?.ownerAccount)
    expect(catalogRows.length).toBeGreaterThan(0)
    expect(productRows.every((p) => p.tenantId === 'tenant-1')).toBe(true)
    expect(paymentRows).toHaveLength(3)
    expect(couponRows).toHaveLength(2)
    expect(discountRows).toHaveLength(2)
    expect(trackRows).toHaveLength(1)
    expect(trackRows[0]?.isActive).toBe(true)
    expect(tableRows).toHaveLength(3)

    // owner 的 PIN 真的能用同一套雜湊機制驗證得過。
    const ownerStaff = staffRows[0]
    expect(ownerStaff).toBeDefined()
    expect(await verifySecret(result!.ownerPin, ownerStaff!.pinHash, ownerStaff!.pinSalt)).toBe(true)
  })

  it('同一個租戶再登入一次是冪等的：回傳 null，不會重複建立任何資料', async () => {
    const db = createTestDb()
    await seedTenantUser(db, 'tenant-1')
    await ensureTenantOnboarded(db, 'tenant-1')
    const second = await ensureTenantOnboarded(db, 'tenant-1')
    expect(second).toBeNull()

    const staffRows = await db.select().from(staff).all()
    expect(staffRows).toHaveLength(1)
  })

  it('兩個不同租戶各自 onboarding，id／account 不會互相衝突', async () => {
    const db = createTestDb()
    await seedTenantUser(db, 'tenant-a')
    await seedTenantUser(db, 'tenant-b')
    const a = await ensureTenantOnboarded(db, 'tenant-a')
    const b = await ensureTenantOnboarded(db, 'tenant-b')
    expect(a?.ownerAccount).not.toBe(b?.ownerAccount)

    const staffRows = await db.select().from(staff).all()
    expect(staffRows).toHaveLength(2)
    expect(new Set(staffRows.map((s) => s.tenantId))).toEqual(new Set(['tenant-a', 'tenant-b']))
  })
})

describe('provisionDeviceForLogin', () => {
  it('核發一組屬於這個租戶的裝置憑證，token 對得上存進 db 的雜湊值', async () => {
    const db = createTestDb()
    await seedTenantUser(db, 'tenant-1')
    const token = await provisionDeviceForLogin(db, 'tenant-1', '測試瀏覽器')

    const rows = await db.select().from(devices).all()
    expect(rows).toHaveLength(1)
    const device = rows[0]
    expect(device).toBeDefined()
    expect(device!.tenantId).toBe('tenant-1')
    expect(device!.name).toBe('測試瀏覽器')
    expect(await verifyToken(token, device!.tokenHash, device!.tokenSalt)).toBe(true)
    expect(device!.lookupHash).toBe(await sha256Hex(token))
  })

  it('每次呼叫都核發一組新的裝置，不是重用同一台（一台瀏覽器＝一台裝置）', async () => {
    const db = createTestDb()
    await seedTenantUser(db, 'tenant-1')
    await provisionDeviceForLogin(db, 'tenant-1', '瀏覽器 A')
    await provisionDeviceForLogin(db, 'tenant-1', '瀏覽器 B')

    const rows = await db.select().from(devices).all()
    expect(rows).toHaveLength(2)
  })
})
