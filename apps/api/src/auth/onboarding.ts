import { eq } from 'drizzle-orm'
import { authorityKeySchema } from '@pos/contract'
import { generateSecureToken, hashSecret, hashToken, sha256Hex } from './hash'
import {
  categories,
  devices,
  diningTables,
  invoiceTracks,
  modifierGroups,
  modifierOptions,
  orderCoupons,
  paymentMethods,
  productModifierGroups,
  products,
  quickDiscounts,
  roles,
  staff
} from '../db/schema'
import type { AnyDb } from '../db/types'

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// 新租戶首次登入時寫入示範菜單與基本配置
export async function ensureTenantOnboarded(
  db: AnyDb,
  tenantId: string
): Promise<{ ownerAccount: string; ownerPin: string } | null> {
  const existingStaff = await db.select().from(staff).where(eq(staff.tenantId, tenantId)).get()
  if (existingStaff) return null

  const ownerRoleId = crypto.randomUUID()
  await db.insert(roles).values([
    {
      id: ownerRoleId,
      tenantId,
      name: '店長',
      capabilities: [...authorityKeySchema.options],
      isSystem: true
    },
    {
      id: crypto.randomUUID(),
      tenantId,
      name: '值班經理',
      capabilities: [
        'canCompItem',
        'canOpenCashier',
        'canManageShift',
        'canCheckOrder',
        'canEditOrderStatus',
        'canRefundOrVoid',
        'canCheckBackgroundSetting',
        'canSetCategory',
        'canSetProduct',
        'canCheckDataAnalysis',
        'canCheckAuditLog'
      ],
      isSystem: true
    },
    {
      id: crypto.randomUUID(),
      tenantId,
      name: '工讀生',
      capabilities: ['canCheckOrder', 'canEditOrderStatus', 'canCheckBackgroundSetting'],
      isSystem: true
    }
  ])

  // 加上隨機後綴防範同租戶帳號衝突
  const ownerAccount = `owner-${crypto.randomUUID().slice(0, 8)}`
  const ownerPin = randomPin()
  const { hash: pinHash, salt: pinSalt } = await hashSecret(ownerPin)
  await db.insert(staff).values({
    id: crypto.randomUUID(),
    tenantId,
    name: '店長',
    jobTitle: '店長',
    account: ownerAccount,
    roleId: ownerRoleId,
    pinHash,
    pinSalt,
    failedPinAttempts: 0,
    lockedUntil: null
  })

  await db.insert(paymentMethods).values(
    [
      { name: '現金', useMethod: '紙鈔' as const },
      { name: '信用卡', useMethod: '感應' as const },
      { name: 'LinePay', useMethod: '掃描' as const }
    ].map((p) => ({ id: crypto.randomUUID(), tenantId, disabled: false, ...p }))
  )

  await db.insert(orderCoupons).values(
    [
      { name: '$50折價券', kind: 'amount' as const, value: 50 },
      { name: '整單95折', kind: 'percent' as const, value: 0.95 }
    ].map((c) => ({ id: crypto.randomUUID(), tenantId, ...c }))
  )
  await db.insert(quickDiscounts).values(
    [
      { name: '常客優惠', kind: 'amount' as const, value: 5 },
      { name: '九折優惠', kind: 'percent' as const, value: 0.9 }
    ].map((d) => ({ id: crypto.randomUUID(), tenantId, ...d }))
  )

  await db.insert(invoiceTracks).values({
    id: crypto.randomUUID(),
    tenantId,
    trackCode: 'AA',
    periodLabel: '示範期別（正式營運前請改成財政部實際配發的字軌）',
    rangeStart: 1,
    rangeEnd: 50000000,
    currentNumber: 0,
    isActive: true
  })

  await db.insert(diningTables).values(
    [
      { tableNumber: 'A1', seats: 4 },
      { tableNumber: 'A2', seats: 2 },
      { tableNumber: 'B1', seats: 6 }
    ].map((t) => ({ id: crypto.randomUUID(), tenantId, status: 'empty' as const, note: '', ...t }))
  )

  const catMain = crypto.randomUUID()
  const catDrink = crypto.randomUUID()
  await db.insert(categories).values([
    { id: catMain, tenantId, name: '主餐' },
    { id: catDrink, tenantId, name: '飲品' }
  ])

  const mgSweetness = crypto.randomUUID()
  const mgIce = crypto.randomUUID()
  const mgTopping = crypto.randomUUID()
  await db.insert(modifierGroups).values([
    { id: mgSweetness, tenantId, name: '甜度', selectionType: 'single' as const, required: true },
    { id: mgIce, tenantId, name: '冰塊', selectionType: 'single' as const, required: true },
    { id: mgTopping, tenantId, name: '加料', selectionType: 'multiple' as const, required: false }
  ])
  await db.insert(modifierOptions).values([
    { id: crypto.randomUUID(), tenantId, groupId: mgSweetness, name: '無糖', priceDelta: 0, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgSweetness, name: '半糖', priceDelta: 0, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgSweetness, name: '正常糖', priceDelta: 0, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgIce, name: '去冰', priceDelta: 0, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgIce, name: '正常冰', priceDelta: 0, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgTopping, name: '加起司', priceDelta: 20, stock: null },
    { id: crypto.randomUUID(), tenantId, groupId: mgTopping, name: '珍珠', priceDelta: 10, stock: null }
  ])

  const prodBurger = crypto.randomUUID()
  const prodTea = crypto.randomUUID()
  await db.insert(products).values([
    { id: prodBurger, tenantId, categoryId: catMain, name: '招牌牛肉漢堡', basePrice: 180, stock: 30 },
    { id: prodTea, tenantId, categoryId: catDrink, name: '翡翠綠茶', basePrice: 30, stock: 100 }
  ])
  await db.insert(productModifierGroups).values([
    { tenantId, productId: prodTea, groupId: mgSweetness },
    { tenantId, productId: prodTea, groupId: mgIce },
    { tenantId, productId: prodTea, groupId: mgTopping }
  ])

  return { ownerAccount, ownerPin }
}

export async function provisionDeviceForLogin(
  db: AnyDb,
  tenantId: string,
  deviceName: string
): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashToken(token)
  await db.insert(devices).values({
    id: crypto.randomUUID(),
    tenantId,
    name: deviceName,
    tokenHash: hash,
    tokenSalt: salt,
    lookupHash: await sha256Hex(token),
    createdAt: new Date().toISOString(),
    revokedAt: null
  })
  return token
}
