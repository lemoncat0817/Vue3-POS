import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { AuthorityKey, DrinkCustomized, OrderStatus } from '@pos/contract'

/**
 * D1（SQLite 方言）的資料表定義。
 *
 * 這是伺服端的全新設計，欄位型別選乾淨的（number／boolean／JSON），不是
 * 照搬 apps/pos 現行因表單輸入造成的型別混用（FormNumeric、'none' 字面
 * 值——見 apps/pos/src/types 的說明）。
 */

// ---------- 菜單 ----------

export const catalogGroups = sqliteTable('catalog_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
})

export const catalogItems = sqliteTable('catalog_items', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .notNull()
    .references(() => catalogGroups.id),
  name: text('name').notNull(),
  priceL: integer('price_l'),
  priceBottle: integer('price_bottle'),
  customized: text('customized').$type<DrinkCustomized>().notNull(),
})

export const addOnOptions = sqliteTable('add_on_options', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
})

// ---------- 促銷（P5：規劃書 §10 的促銷引擎） ----------

/** 現金折價券（例如「$50折價券」），後台可自由新增／刪除。 */
export const moneyCoupons = sqliteTable('money_coupons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  discountMoney: integer('discount_money').notNull(),
})

/** 折數折價券（例如「整單95折」），後台可自由新增／刪除。 */
export const percentCoupons = sqliteTable('percent_coupons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  discountPercent: real('discount_percent').notNull(),
})

/**
 * 常用折扣固定 5 筆（見 @pos/domain 的 OftenUseRates），slot 是
 * 0～4 的固定位置（0：環保折扣、1：瓶裝折扣、2～4：三個折數折扣），
 * 後台只能編輯內容、不能新增或刪除這張表的列（對照 apps/pos 現行
 * offerSetting 頁面：常用折扣沒有新增/刪除功能，只有編輯）。
 */
export const oftenUseRates = sqliteTable('often_use_rates', {
  slot: integer('slot').primaryKey(),
  name: text('name').notNull(),
  discountMoney: integer('discount_money').notNull(),
  discountPercent: real('discount_percent').notNull(),
})

// ---------- 裝置憑證（P4：規劃書 §9 的身分系統） ----------

/**
 * 一台終端機一筆紀錄。只存雜湊值＋鹽（見 src/auth/hash.ts）；明碼只在
 * 核發當下（POST /api/devices）回傳一次，之後即使是這個資料庫本身也
 * 還原不出明碼——跟 GitHub personal access token 那類憑證同一種設計。
 * revokedAt 非 null 代表這台裝置的憑證已被撤銷，requireDeviceToken
 * （見 middleware/require-device-token.ts）會拒絕它，不需要真的刪除
 * 這筆紀錄（保留稽核軌跡）。
 */
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(),
  tokenSalt: text('token_salt').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  revokedAt: text('revoked_at'),
})

// ---------- 員工 ----------

export const staff = sqliteTable(
  'staff',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    jobTitle: text('job_title').notNull(),
    account: text('account').notNull(),
    // 權限只有這一份陣列來源（對照 D-10：apps/pos 現行是 16 個獨立布林
    // 欄位加一份平行陣列的雙重來源）。
    capabilities: text('capabilities', { mode: 'json' }).$type<AuthorityKey[]>().notNull(),
    // 操作員 PIN（P4：規劃書 §9）。只存雜湊值＋鹽（見 src/auth/hash.ts），
    // 明碼只在登入請求（POST /api/auth/operator-login）當下經手。
    pinHash: text('pin_hash').notNull(),
    pinSalt: text('pin_salt').notNull(),
    // 連續輸入錯誤的次數與鎖定到期時間，見 routes/auth.ts 的鎖定邏輯
    // ——4～6 碼的 PIN 遠比密碼容易暴力猜中，沒有這道防線的話雜湊本身
    // 起不了太大作用。
    failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
    lockedUntil: text('locked_until'),
  },
  (table) => [uniqueIndex('staff_account_idx').on(table.account)],
)

// ---------- 訂單 ----------

export const orders = sqliteTable(
  'orders',
  {
    orderId: text('order_id').primaryKey(),
    orderTime: text('order_time').notNull(),
    orderStatus: text('order_status').$type<OrderStatus>().notNull(),
    staff: text('staff').notNull(),
    orderBagCount: integer('order_bag_count').notNull(),
    orderCupCount: integer('order_cup_count').notNull(),
    orderTotalPrice: integer('order_total_price').notNull(),
    orderPayment: text('order_payment').notNull(),
    orderDiscount: integer('order_discount').notNull(),
    orderPaymentPrice: integer('order_payment_price').notNull(),
    discountName: text('discount_name').notNull(),
    // 冪等鍵：同一個 idempotencyKey 重送不會建立第二筆訂單（見 §8）。
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex('orders_idempotency_key_idx').on(table.idempotencyKey)],
)

export const orderLines = sqliteTable('order_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.orderId),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  size: text('size').notNull(),
  count: integer('count').notNull(),
  discount: integer('discount').notNull(),
  addList: text('add_list', { mode: 'json' }).$type<string | string[]>().notNull(),
  addListPrice: integer('add_list_price').notNull(),
  totalPrice: integer('total_price').notNull(),
  currentDiscountPercent: real('current_discount_percent').notNull(),
  currentDiscountMoney: real('current_discount_money').notNull(),
  useDiscountPercent: text('use_discount_percent').notNull(),
  useDiscountMoney: text('use_discount_money').notNull(),
  useDiscountFree: text('use_discount_free').notNull(),
  freeDiscount: integer('free_discount', { mode: 'boolean' }).notNull(),
  ecoDiscount: integer('eco_discount', { mode: 'boolean' }).notNull(),
  bottleDiscount: integer('bottle_discount', { mode: 'boolean' }).notNull(),
  oftenUseDiscount1: integer('often_use_discount_1', { mode: 'boolean' }).notNull(),
  oftenUseDiscount2: integer('often_use_discount_2', { mode: 'boolean' }).notNull(),
  oftenUseDiscount3: integer('often_use_discount_3', { mode: 'boolean' }).notNull(),
})

export const schema = {
  catalogGroups,
  catalogItems,
  addOnOptions,
  moneyCoupons,
  percentCoupons,
  oftenUseRates,
  devices,
  staff,
  orders,
  orderLines,
}
