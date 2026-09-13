import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from 'drizzle-orm/sqlite-core'
import type {
  AuditLogAction,
  AuthorityKey,
  InvoiceCarrierType,
  InvoiceStatus,
  MemberPointLedgerReason,
  ModifierSelectionType,
  OrderChannel,
  OrderStatus,
  PaymentUseMethod,
  QuickDiscountKind,
  TableStatus
} from '@pos/contract'

// D1（SQLite）資料表定義。型別刻意用乾淨的 number／boolean／JSON，不照搬
// apps/pos 現行因表單輸入而混用的型別（FormNumeric、'none' 字面值）。

// ---------- 帳號與租戶 ----------

// OAuth 登入身分（Google／GitHub）。一筆 users 即一個租戶邊界，下方所有業務表的
// tenantId 都指向這裡的 id——不另外設 tenants 表，1 帳號＝1 租戶。同一個 email
// 分別用 Google、GitHub 登入目前視為兩個不同帳號，不做跨 provider 合併。
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    provider: text('provider').$type<'google' | 'github'>().notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    // 營業日換日時間（0~23 時鐘小時）：凌晨營業到這個時間之前的訂單仍歸屬前一
    // 個營業日。預設 4 點，深夜營業的租戶可以自行調整，見 @pos/domain 的
    // getBusinessDate() 與 reports.ts 的每小時營收報表。
    businessDayStartHour: integer('business_day_start_hour').notNull().default(4),
    // 每消費多少元累加 1 點，業主可在會員管理頁自行調整，見 @pos/domain 的
    // DEFAULT_POINTS_PER_CURRENCY_UNIT 與 routes/tenant-settings.ts。
    pointsPerCurrencyUnit: integer('points_per_currency_unit').notNull().default(10),
    // 結帳折抵時，每多少點折抵 1 元，見 @pos/domain 的 DEFAULT_POINTS_REDEMPTION_RATE。
    pointsRedemptionRate: integer('points_redemption_rate').notNull().default(10),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [uniqueIndex('users_provider_account_idx').on(table.provider, table.providerAccountId)]
)

// OAuth 登入後核發的瀏覽器 session，做法比照 operatorSessions／devices：明碼
// 只在核發當下回傳一次（存進 httpOnly cookie），之後只存雜湊值＋鹽。
export const webSessions = sqliteTable('web_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  tokenSalt: text('token_salt').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at')
})

// ---------- 菜單 ----------
// 不綁定單一餐飲品類：品項只有一個底價，客製化選項（尺寸、甜度、熟度、加購……）
// 一律透過可重複掛用的規格群組（modifierGroups）表達，見 @pos/contract 的說明。
// 「加購」只是 selectionType='multiple'、required=false 的規格群組，不另外開表，才能一樣受 productModifierGroups 約束。

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull()
})

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  name: text('name').notNull(),
  basePrice: integer('base_price').notNull(),
  // null 代表不追蹤此品項庫存，見 @pos/contract 的 catalogStockSchema。
  stock: integer('stock')
})

export const modifierGroups = sqliteTable('modifier_groups', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  selectionType: text('selection_type').$type<ModifierSelectionType>().notNull(),
  required: integer('required', { mode: 'boolean' }).notNull()
})

export const modifierOptions = sqliteTable('modifier_options', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  groupId: text('group_id')
    .notNull()
    .references(() => modifierGroups.id),
  name: text('name').notNull(),
  priceDelta: integer('price_delta').notNull(),
  // null 代表不追蹤此選項庫存，語意同 products.stock，承接原本 add_on_options.stock。
  stock: integer('stock')
})

// 品項與規格群組的多對多關聯：同一群組（例如「甜度」）可掛在任意數量的品項上。
export const productModifierGroups = sqliteTable(
  'product_modifier_groups',
  {
    tenantId: text('tenant_id').references(() => users.id),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    groupId: text('group_id')
      .notNull()
      .references(() => modifierGroups.id)
  },
  (table) => [primaryKey({ columns: [table.productId, table.groupId] })]
)

// ---------- 促銷 ----------

// 訂單折價券：整張訂單套用一張的具名折扣（例如「$50折價券」「整單95折」），
// 後台可自由新增／刪除任意筆數。跟下面的 quickDiscounts 同形狀，取代原本
// 拆成 money_coupons／percent_coupons 兩張表的設計。
export const orderCoupons = sqliteTable('order_coupons', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  kind: text('kind').$type<QuickDiscountKind>().notNull(),
  value: real('value').notNull()
})

// 快速折扣：點餐頁購物車可直接套用在勾選品項上的具名折扣，後台可自由新增／
// 刪除任意筆數（見 @pos/domain 的 QuickDiscount），不再是固定 slot 的表。
export const quickDiscounts = sqliteTable('quick_discounts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  kind: text('kind').$type<QuickDiscountKind>().notNull(),
  value: real('value').notNull()
})

// ---------- 裝置憑證 ----------

// 一台終端機一筆紀錄，只存雜湊值＋鹽（見 src/auth/hash.ts），明碼僅核發
// 當下回傳一次（同 GitHub PAT 的設計）。revokedAt 非 null 代表憑證已撤銷，
// 不刪除紀錄以保留稽核軌跡。
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(),
  tokenSalt: text('token_salt').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  revokedAt: text('revoked_at')
})

// ---------- 員工與權限群組 ----------

// 權限群組（角色）。權限只掛在角色身上，員工只認 roleId——不是每個員工各自一份
// 權限陣列，改動角色即時套用到底下所有員工，不會有「有些人改了、有些人沒改」
// 的雙重來源問題。isSystem 標記三個內建範本（店長／值班經理／工讀生），不可
// 刪除，但權限內容仍可調整。
export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    capabilities: text('capabilities', { mode: 'json' }).$type<AuthorityKey[]>().notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false)
  },
  // (tenantId, name) 複合唯一索引：每個新租戶 onboarding 都會種內建的
  // 「店長／值班經理／工讀生」三個角色名稱（見 auth/onboarding.ts），globally
  // unique 會讓第二個租戶一註冊就撞唯一鍵。tenantId 為 null 的舊資料（多租戶
  // 上線前的過渡期）不在這道保護範圍內——SQLite 的 UNIQUE 索引視 NULL 互不
  // 相等，這是已知、可接受的過渡期限制。
  (table) => [uniqueIndex('roles_tenant_name_idx').on(table.tenantId, table.name)]
)

export const staff = sqliteTable(
  'staff',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    jobTitle: text('job_title').notNull(),
    account: text('account').notNull(),
    // 權限只認角色（見上方 roles），不是每個員工各自一份權限陣列。
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id),
    // 操作員 PIN，只存雜湊值＋鹽，明碼只在登入請求當下經手。
    pinHash: text('pin_hash').notNull(),
    pinSalt: text('pin_salt').notNull(),
    // 連續輸入錯誤次數與鎖定到期時間（見 routes/auth.ts）：PIN 只有
    // 4～6 碼，遠比密碼容易暴力猜中，需要這道防線。
    failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
    lockedUntil: text('locked_until')
  },
  // (tenantId, account) 複合唯一索引，理由同 roles_tenant_name_idx——每個新
  // 租戶 onboarding 都會種一個 owner 帳號，不同租戶的 account 字串本來就會
  // 重複。
  (table) => [uniqueIndex('staff_tenant_account_idx').on(table.tenantId, table.account)]
)

// PIN 登入成功後核發的操作員 session，取代直接信任用戶端回報的 staffId
// ——staffId 本身是 GET /api/staff 就能查到的公開資訊，不能當作身分證明
// （見 middleware/require-capability.ts）。做法比照 devices：明碼只在
// 核發當下回傳一次，之後只存雜湊值＋鹽；revokedAt 非 null 代表已登出或
// 已被撤銷，過期則看 expiresAt，兩者都不刪除紀錄以保留稽核軌跡。
export const operatorSessions = sqliteTable('operator_sessions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  staffId: text('staff_id')
    .notNull()
    .references(() => staff.id),
  tokenHash: text('token_hash').notNull(),
  tokenSalt: text('token_salt').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at')
})

// 付款方式。後台設定允許用哪些方式收款——跟訂單 tenders[] 裡的 method
// （自由字串）是不同的東西，這張表只影響付款面板要顯示哪些選項。
export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  disabled: integer('disabled', { mode: 'boolean' }).notNull(),
  useMethod: text('use_method').$type<PaymentUseMethod>().notNull()
})

// ---------- 訂單 ----------

export const orders = sqliteTable(
  'orders',
  {
    orderId: text('order_id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    orderTime: text('order_time').notNull(),
    orderStatus: text('order_status').$type<OrderStatus>().notNull(),
    // 預設 '外帶' 只用於補齊此欄位上線前的歷史訂單，新訂單一律由前端明確帶入。
    orderChannel: text('order_channel').$type<OrderChannel>().notNull().default('外帶'),
    staff: text('staff').notNull(),
    orderBagCount: integer('order_bag_count').notNull(),
    orderCupCount: integer('order_cup_count').notNull(),
    orderTotalPrice: integer('order_total_price').notNull(),
    // 顯示用付款方式摘要（多筆 tender 以頓號連接），實際明細見 order_tenders。
    orderPayment: text('order_payment').notNull(),
    orderDiscount: integer('order_discount').notNull(),
    orderPaymentPrice: integer('order_payment_price').notNull(),
    // 找零總額，從 order_tenders 的 receivedAmount 算出後存一份，理由同 orderPayment。
    changeDue: integer('change_due').notNull().default(0),
    discountName: text('discount_name').notNull(),
    // 冪等鍵：同一個 idempotencyKey 重送不會建立第二筆訂單。
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    // 作廢紀錄，只描述「目前這次作廢」；orderStatus 改回「已完成」時一併
    // 清成 null，跟可累積多筆的 order_refunds 是不同概念。
    voidReason: text('void_reason'),
    voidedBy: text('voided_by'),
    voidedAt: text('voided_at'),
    // 每筆訂單一律開立發票號碼，此欄位上線前的歷史訂單以空字串佔位（畫面上
    // 顯示為「無，此功能上線前建立」），不是假造發票號碼。
    invoiceNumber: text('invoice_number').notNull().default(''),
    invoiceCarrierType: text('invoice_carrier_type')
      .$type<InvoiceCarrierType>()
      .notNull()
      .default('無載具'),
    // 只有手機條碼／統一編號才有值，見 @pos/contract 的 invoiceCarrierSchema。
    invoiceCarrierValue: text('invoice_carrier_value'),
    // 這筆訂單掛在哪個會員名下，沒有掛會員是 null。
    memberId: text('member_id').references(() => members.id),
    // 這筆訂單掛會員時累加的點數，固定不變（沒有掛會員是 0）；退款/作廢時
    // 依這個原始值反推應收回多少點，不會回頭改寫這裡，見 routes/orders.ts
    // 的 pointsWithheldForRefundedAmount()。
    pointsEarned: integer('points_earned').notNull().default(0),
    // 這筆訂單結帳時花掉的點數，固定不變（沒有折抵是 0）；整單作廢會全額
    // 退還，撤銷作廢會重新扣一次，都不會回頭改寫這裡，見 routes/orders.ts。
    pointsRedeemed: integer('points_redeemed').notNull().default(0),
    // 開立時一律 'issued'，模擬批次上傳後變成 'submitted'，訂單作廢時變成
    // 'voided'。歷史訂單預設也是 'issued'。
    invoiceStatus: text('invoice_status').$type<InvoiceStatus>().notNull().default('issued'),
    invoiceSubmittedAt: text('invoice_submitted_at'),
    // 內用桌號，純紀錄用途，故意不設外鍵指到 dining_tables——桌況跟訂單各自獨立維護。
    tableNumber: text('table_number'),
    // 訂單備註（外送地址、取件時間、客製化需求等），純文字紀錄用途，伺服端不解析內容。
    note: text('note')
  },
  (table) => [
    // (tenantId, idempotencyKey) 複合唯一索引：冪等鍵的唯一性只需要在同一
    // 租戶內成立。
    uniqueIndex('orders_tenant_idempotency_key_idx').on(table.tenantId, table.idempotencyKey),
    // 訂單列表頁預設依時間排序分頁，狀態是最常用的快捷篩選（見
    // views/order/index.vue 的狀態快捷鍵）。每個查詢一定先過濾 tenantId，
    // 索引改成 tenantId 開頭的複合索引才吃得到。
    index('orders_tenant_order_time_idx').on(table.tenantId, table.orderTime),
    index('orders_tenant_order_status_idx').on(table.tenantId, table.orderStatus)
  ]
)

// ---------- 會員與顧客經營 ----------

// 會員。phone 是結帳當下查會員唯一合理的輸入方式（無讀卡機、不要求記編號），設唯一索引。
export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    // 目前累積值，逐筆異動明細見下面的 memberPointLedger。
    points: integer('points').notNull().default(0),
    // 生日，YYYY-MM-DD，選填。用來做生日行銷（本月壽星名單），見
    // routes/members.ts 的 listMemberBirthdaysRoute。
    birthday: text('birthday'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    // 軟刪除：有值代表已刪除。改用軟刪除是因為 member_point_ledger、orders
    // 都有外鍵指到這裡——硬刪除得先斷開所有關聯（例如把 orders.memberId
    // 設回 null），異動明細更是沒辦法斷開（memberId 是 NOT NULL），會直接
    // 撞上外鍵約束。軟刪除後 orders.memberId 不用再改寫，消費歷史永遠留著
    // 正確的會員關聯；手機號碼欄位不會因軟刪除而釋出重複使用，見下面
    // members_tenant_phone_idx 的說明。
    deletedAt: text('deleted_at')
  },
  // (tenantId, phone) 複合唯一索引，理由同 roles_tenant_name_idx——手機號碼
  // 的唯一性只需要在同一租戶內成立。刻意不排除已軟刪除的列（不是部分索引），
  // 代價是被刪除會員的手機號碼無法給新會員繼續使用；換成部分索引雖然能解決，
  // 但目前沒有實際需求，先用簡單、不會讓 unique 約束跟應用層檢查邏輯兜不
  // 起來的版本。
  (table) => [uniqueIndex('members_tenant_phone_idx').on(table.tenantId, table.phone)]
)

// 會員點數異動明細——members.points 只存目前餘額，每一筆加點/扣點的來源
// 記在這裡，供稽核、對帳、日後爭議查詢。reason 是封閉集合（見 @pos/contract
// 的 memberPointLedgerReasonSchema），orderId 只有訂單相關的異動才有值。
export const memberPointLedger = sqliteTable(
  'member_point_ledger',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id),
    delta: integer('delta').notNull(),
    reason: text('reason').$type<MemberPointLedgerReason>().notNull(),
    orderId: text('order_id').references(() => orders.orderId),
    // 手動調整才有操作人／備註；訂單相關的異動由訂單本身的 staff／operator 交代來源。
    operator: text('operator'),
    note: text('note'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [
    index('member_point_ledger_tenant_member_idx').on(table.tenantId, table.memberId)
  ]
)

// 會員分級門檻，業主自訂（比照 payment_methods 的做法）。等級不存在會員
// 身上，而是每次查詢時依「累積消費金額」（sum(orderPaymentPrice)，排除
// 已取消訂單）即時比對門檻算出目前等級，避免額外一份可能跟訂單資料兜不
// 起來的快取欄位，見 routes/members.ts 的 resolveMemberTiers()。
export const memberTiers = sqliteTable('member_tiers', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  minSpend: integer('min_spend').notNull()
})

// 訂單序號的原子計數器。用 SQLite 的 `INSERT ... ON CONFLICT DO UPDATE
// ... RETURNING` 在單一陳述式內完成「讀當前值、加一、寫回」，避免兩台
// 終端幾乎同時送單時算出相同序號、後 insert 者因主鍵衝突失敗（見
// routes/orders.ts 的 nextOrderSequence()）。
// 複合主鍵 (tenantId, businessDate)：序號計數器每個租戶各自獨立起算，理由同
// roles_tenant_name_idx。
export const orderSequences = sqliteTable(
  'order_sequences',
  {
    tenantId: text('tenant_id').references(() => users.id),
    businessDate: text('business_date').notNull(),
    counter: integer('counter').notNull()
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.businessDate] })]
)

// 發票號碼的舊版計數器（單一固定前綴＋全域遞增流水號，不做字軌輪替）。
// 已被下方 invoiceTracks 取代，表留著不刪但新的 nextInvoiceNumber() 不再讀寫它。
export const invoiceSequences = sqliteTable('invoice_sequences', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  counter: integer('counter').notNull()
})

// 電子發票字軌。真正的字軌由財政部核發、商家申請取得，這裡設計成後台
// 手動輸入的設定資料。同時間每個租戶各自只會有一個字軌 isActive。
export const invoiceTracks = sqliteTable('invoice_tracks', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  trackCode: text('track_code').notNull(),
  periodLabel: text('period_label').notNull(),
  rangeStart: integer('range_start').notNull(),
  rangeEnd: integer('range_end').notNull(),
  currentNumber: integer('current_number').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull()
})

export const orderLines = sqliteTable(
  'order_lines',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tenantId: text('tenant_id').references(() => users.id),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.orderId),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    count: integer('count').notNull(),
    discount: integer('discount').notNull(),
    addList: text('add_list', { mode: 'json' }).$type<string | string[]>().notNull(),
    addListPrice: integer('add_list_price').notNull(),
    totalPrice: integer('total_price').notNull(),
    freeDiscount: integer('free_discount', { mode: 'boolean' }).notNull(),
    // 套用哪一筆快速折扣，沒套用是 null；name 是下單當下的名稱快照，避免
    // 後台之後改名或刪除該筆快速折扣時，歷史訂單的顯示跟著跑掉。
    quickDiscountId: text('quick_discount_id'),
    quickDiscountName: text('quick_discount_name').notNull().default('')
  },
  // 訂單列表頁分頁後，每頁只用 orderId IN (...) 撈這頁的明細，不再是
  // 整表撈出來在記憶體 join，FK 欄位沒有索引的話這個查詢一樣是全表掃描。
  (table) => [index('order_lines_order_id_idx').on(table.orderId)]
)

// 一筆訂單實際收到的每一筆支付，取代舊的 orders.orderPayment 單一字串
// （無法表達「現金 300 + 行動支付找零」這種混合收款）。receivedAmount
// 只在需要找零時才有值，為 null 代表這筆 tender 剛好付清、沒有找零。
export const orderTenders = sqliteTable(
  'order_tenders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tenantId: text('tenant_id').references(() => users.id),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.orderId),
    // 顯示順序（對應使用者在付款面板加入 tender 的順序），不是主鍵。
    seq: integer('seq').notNull(),
    method: text('method').notNull(),
    amount: integer('amount').notNull(),
    receivedAmount: integer('received_amount')
  },
  (table) => [index('order_tenders_order_id_idx').on(table.orderId)]
)

// 訂單的退款紀錄，跟作廢（orders.voidReason 那組欄位）是不同概念：作廢
// 代表整筆訂單不算數，退款代表訂單仍「已完成」、只是退了部分或全部的錢
// ——同一筆訂單可以有多筆退款。id 用 ULID，理由同 orders.idempotencyKey：
// 同一個 id 重送不會建立第二筆。
export const orderRefunds = sqliteTable(
  'order_refunds',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.orderId),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    operator: text('operator').notNull(),
    at: text('at').notNull()
  },
  (table) => [index('order_refunds_order_id_idx').on(table.orderId)]
)

// 班別。單店單機情境下同一時間全店只允許一筆 status='open' 的班別，這條
// 規則在 routes/shifts.ts 用查詢檢查，不是資料庫層 constraint。id 由
// 用戶端開帳當下用 ULID 產生並送入，同一個 id 重送會拿回同一筆班別。
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  status: text('status').$type<'open' | 'closed'>().notNull(),
  openedBy: text('opened_by').notNull(),
  openedAt: text('opened_at').notNull(),
  openingFloat: integer('opening_float').notNull(),
  closedBy: text('closed_by'),
  closedAt: text('closed_at'),
  // 以下五欄只有收班當下才算得出來，開帳時一律是 null。
  cashSales: integer('cash_sales'),
  refunds: integer('refunds'),
  expectedCash: integer('expected_cash'),
  actualCash: integer('actual_cash'),
  variance: integer('variance')
})

/** 班別期間的現金異動（中途提現／存入），見 @pos/domain 的 summarizeShiftCash()。 */
export const cashMovements = sqliteTable('cash_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id').references(() => users.id),
  shiftId: text('shift_id')
    .notNull()
    .references(() => shifts.id),
  type: text('type').$type<'in' | 'out'>().notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  operator: text('operator').notNull(),
  at: text('at').notNull()
})

// ---------- API 安全加固 ----------

// 速率限制計數器。key 是裝置憑證／核發密鑰／來源 IP 其中一種，
// windowStart／count 是固定視窗演算法的狀態。用 D1 而不是記憶體內計數器：
// Workers 的執行環境隨時可能換一個全新的 isolate，純記憶體計數器不可靠。
export const rateLimitCounters = sqliteTable('rate_limit_counters', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull()
})

// 稽核紀錄，取代原本只印在瀏覽器主控台的做法（分頁關閉紀錄就消失）。
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id').references(() => users.id),
  action: text('action').$type<AuditLogAction>().notNull(),
  operator: text('operator').notNull(),
  detail: text('detail').notNull(),
  createdAt: text('created_at').notNull()
})

// ---------- 桌況管理 ----------

// 內用桌況，狀態由店員手動維護（帶位／清空／預約），不是由訂單狀態推導。
// tableNumber 不設唯一索引：允許重複命名比用資料庫限制擋住更適合後台自訂命名習慣。
export const diningTables = sqliteTable('dining_tables', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  tableNumber: text('table_number').notNull(),
  seats: integer('seats').notNull(),
  status: text('status').$type<TableStatus>().notNull().default('empty'),
  note: text('note').notNull().default('')
})

export const schema = {
  users,
  webSessions,
  categories,
  products,
  modifierGroups,
  modifierOptions,
  productModifierGroups,
  orderCoupons,
  quickDiscounts,
  devices,
  roles,
  staff,
  operatorSessions,
  paymentMethods,
  orders,
  orderLines,
  orderTenders,
  orderRefunds,
  orderSequences,
  invoiceSequences,
  shifts,
  cashMovements,
  rateLimitCounters,
  auditLogs,
  members,
  memberPointLedger,
  memberTiers,
  invoiceTracks,
  diningTables
}
