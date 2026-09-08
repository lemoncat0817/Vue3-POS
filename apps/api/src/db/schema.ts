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
    // 顯示用的付款方式摘要（多筆 tender 以頓號連接），實際明細見
    // order_tenders 表——這個欄位不是計算來源，只是列表頁不用另外
    // join 就能顯示付款方式的捷徑，跟 discountName 是同樣的取捨。
    orderPayment: text('order_payment').notNull(),
    orderDiscount: integer('order_discount').notNull(),
    orderPaymentPrice: integer('order_payment_price').notNull(),
    // 找零總額（P6：規劃書 §10 P0「混合支付」）。從 order_tenders 的
    // receivedAmount 算出後存一份在這裡，理由跟 orderPayment 一樣：
    // 列表頁與收據不用為了一個數字另外 join 明細表。
    changeDue: integer('change_due').notNull().default(0),
    discountName: text('discount_name').notNull(),
    // 冪等鍵：同一個 idempotencyKey 重送不會建立第二筆訂單（見 §8）。
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    // 作廢紀錄（P12：規劃書 §10 P0「退款／作廢」）。orderStatus 改成
    // 「已取消」時才會有值；改回「已完成」（也就是撤銷這次作廢）時
    // 一併清成 null——這三個欄位只描述「目前這次作廢」，不是累積的
    // 歷史紀錄，跟 order_refunds 表（可以有很多筆、彼此獨立）不同。
    voidReason: text('void_reason'),
    voidedBy: text('voided_by'),
    voidedAt: text('voided_at'),
  },
  (table) => [uniqueIndex('orders_idempotency_key_idx').on(table.idempotencyKey)],
)

/**
 * 訂單序號的原子計數器（P6：規劃書 §3「多終端情境」）。
 *
 * P2～P5 的作法是「查同一營業日已有幾筆訂單、+1」，這在單一終端情境下
 * 沒問題，但兩台終端幾乎同時送單時，兩者查到的訂單數可能相同，算出
 * 一樣的序號——後 insert 的那筆會因為 orderId 撞到 orders 表的
 * primary key 直接失敗，顧客等於白排了隊。這張表用 SQLite 的
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` 換成單一 SQL
 * 陳述式內完成「讀當前值、加一、寫回」，不需要額外包交易（單一陳述式
 * 本身就是原子的），見 routes/orders.ts 的 nextOrderSequence()。
 */
export const orderSequences = sqliteTable('order_sequences', {
  businessDate: text('business_date').primaryKey(),
  counter: integer('counter').notNull(),
})

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

/**
 * 一筆訂單實際收到的每一筆支付（P6：規劃書 §10 P0「混合支付」）。
 *
 * 取代舊的 orders.orderPayment 單一字串——那個欄位只能表達「這筆訂單
 * 用一種方式付清」，無法表達「現金 300 元 + 行動支付找零」這種真實
 * 收銀情境，而班別結算、退款、發票全部都要知道「實際收了哪些支付、
 * 各多少」才對得起帳（見規劃書 §10 P0 表格「混合支付必須最先」的
 * 說明）。receivedAmount 只在需要找零時才有值（主要是現金），為
 * null 代表「這筆 tender 剛好付清分擔的金額，沒有找零」。
 */
export const orderTenders = sqliteTable('order_tenders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.orderId),
  // 顯示順序（對應使用者在付款面板上加入 tender 的順序），不是主鍵。
  seq: integer('seq').notNull(),
  method: text('method').notNull(),
  amount: integer('amount').notNull(),
  receivedAmount: integer('received_amount'),
})

/**
 * 訂單的退款紀錄（P12：規劃書 §10 P0「退款／作廢」）。跟作廢（orders.
 * voidReason 那一組欄位）是不同的概念：作廢代表整筆訂單不算數，退款
 * 代表訂單仍然「已完成」、只是退了部分或全部的錢給顧客——同一筆訂單
 * 可以有多筆退款紀錄（見 @pos/domain 的 summarizeOrderRefunds()），
 * id 用 ULID（由用戶端在退款當下產生並送入），理由跟 orders.
 * idempotencyKey、shifts.id 一致：同一個 id 重送不會建立第二筆退款。
 */
export const orderRefunds = sqliteTable('order_refunds', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.orderId),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  operator: text('operator').notNull(),
  at: text('at').notNull(),
})

/**
 * 班別（P6：規劃書 §10 P0「班別結帳」）。單店單機情境下同一時間全店
 * 只允許一筆 status='open' 的班別，這條規則在 routes/shifts.ts 裡用
 * 查詢檢查，不是資料庫層級的 constraint（SQLite 沒有方便表達「這個
 * 欄位值最多有一列符合某個條件」的部分唯一索引語法能跨 D1／
 * better-sqlite3 兩種 driver 都可靠運作，查詢層檢查已經足夠——單店
 * 單機下開帳頻率低，不構成效能疑慮）。
 *
 * id 由用戶端在開帳當下用 ULID 產生並送入（見 @pos/contract 的
 * openShiftRequestSchema），理由跟訂單的 idempotencyKey 一致：同一個
 * id 重送會拿回同一筆班別，不會重複開帳。
 */
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  status: text('status').$type<'open' | 'closed'>().notNull(),
  openedBy: text('opened_by').notNull(),
  openedAt: text('opened_at').notNull(),
  openingFloat: integer('opening_float').notNull(),
  closedBy: text('closed_by'),
  closedAt: text('closed_at'),
  // 以下五個欄位只有收班當下才算得出來，開帳時一律是 null（見
  // @pos/contract 的 shiftSchema 說明）。refunds 是 P12（規劃書 §10
  // P0「退款／作廢」）才加入的欄位，跟 cashSales 一樣要看整段班別
  // 區間的資料才算得出來。
  cashSales: integer('cash_sales'),
  refunds: integer('refunds'),
  expectedCash: integer('expected_cash'),
  actualCash: integer('actual_cash'),
  variance: integer('variance'),
})

/** 班別期間的現金異動（中途提現／存入），見 @pos/domain 的 summarizeShiftCash()。 */
export const cashMovements = sqliteTable('cash_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shiftId: text('shift_id')
    .notNull()
    .references(() => shifts.id),
  type: text('type').$type<'in' | 'out'>().notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  operator: text('operator').notNull(),
  at: text('at').notNull(),
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
  orderTenders,
  orderRefunds,
  orderSequences,
  shifts,
  cashMovements,
}
