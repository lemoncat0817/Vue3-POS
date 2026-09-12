import { eq } from 'drizzle-orm'
import { authorityKeySchema } from '@pos/contract'
import { generateSecureToken, hashSecret } from './hash'
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

/** 4 碼數字 PIN，跟 requireDeviceToken／PIN 登入既有的長度慣例一致。 */
function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * 新租戶第一次 OAuth 登入時，補一份跟 seed/ 目錄下那組示範資料同樣內容的
 * 起始菜單／付款方式／促銷／發票字軌／桌況／owner 員工，讓帳號一登入就有
 * 東西可以操作，不是空的——見 seed/catalog.sql 等檔案（本機／正式環境
 * `db:seed:*` 手動跑的那份），這裡是同一份內容但改成程式化寫入、
 * id 一律重新產生、每個欄位都帶 tenantId，供多租戶下每個新帳號各自使用。
 *
 * 用「這個租戶有沒有 staff」判斷是不是第一次登入，冪等：已經 onboard
 * 過的租戶再次登入不會重複灌一次種子資料。
 */
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
        'canCheckDataAnalysis'
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

  // account 唯一鍵是 (tenantId, account) 複合索引，同租戶內才需要唯一
  // （見 db/schema.ts 的 staff_tenant_account_idx），這裡固定加隨機後綴
  // 純粹是避免同租戶內恰好已經有一個 'owner' 帳號時撞名。
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

  // 示範菜單，內容對應 seed/catalog.sql，id 一律重新產生並帶 tenantId。
  const catMain = crypto.randomUUID()
  const catDrink = crypto.randomUUID()
  await db.insert(categories).values([
    { id: catMain, tenantId, name: '主餐' },
    { id: catDrink, tenantId, name: '飲品' }
  ])

  // mgTopping 只掛在 prodTea 上：示範加購（selectionType='multiple' 的規格群組）不會出現在漢堡排底下。
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

/**
 * OAuth 登入成功後，幫這個瀏覽器核發一組屬於這個租戶的裝置憑證——做法對應
 * routes/devices.ts 的核發端點，但那支端點是給已經有裝置的店家另外加開新
 * 終端機用、核發當下不知道 tenantId（見該檔案的說明），這裡是登入當下就
 * 知道租戶是誰，直接寫入，不經過那支公開端點。每次登入都核發一組新的，
 * 概念上等同「這台瀏覽器＝一台新終端機」，可以各自撤銷、不用等 devices.ts
 * 支援指定租戶。
 */
export async function provisionDeviceForLogin(
  db: AnyDb,
  tenantId: string,
  deviceName: string
): Promise<string> {
  const token = generateSecureToken()
  const { hash, salt } = await hashSecret(token)
  await db.insert(devices).values({
    id: crypto.randomUUID(),
    tenantId,
    name: deviceName,
    tokenHash: hash,
    tokenSalt: salt,
    createdAt: new Date().toISOString(),
    revokedAt: null
  })
  return token
}
