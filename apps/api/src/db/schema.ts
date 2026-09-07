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

export const schema = { catalogGroups, catalogItems, addOnOptions, staff, orders, orderLines }
