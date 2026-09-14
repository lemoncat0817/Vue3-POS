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

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    provider: text('provider').$type<'google' | 'github'>().notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    businessDayStartHour: integer('business_day_start_hour').notNull().default(4),
    pointsPerCurrencyUnit: integer('points_per_currency_unit').notNull().default(10),
    pointsRedemptionRate: integer('points_redemption_rate').notNull().default(10),
    pointsExpiryMonths: integer('points_expiry_months'),
    autoOccupyTableOnCheckout: integer('auto_occupy_table_on_checkout', { mode: 'boolean' })
      .notNull()
      .default(true),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [uniqueIndex('users_provider_account_idx').on(table.provider, table.providerAccountId)]
)

export const webSessions = sqliteTable(
  'web_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    tokenSalt: text('token_salt').notNull(),
    // 允許 NULL：既有 session 只有 PBKDF2 雜湊、沒有明文可回補這欄
    lookupHash: text('lookup_hash'),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
    revokedAt: text('revoked_at')
  },
  (table) => [index('web_sessions_lookup_hash_idx').on(table.lookupHash)]
)

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
  stock: integer('stock')
})

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

export const orderCoupons = sqliteTable('order_coupons', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  kind: text('kind').$type<QuickDiscountKind>().notNull(),
  value: real('value').notNull()
})

export const quickDiscounts = sqliteTable('quick_discounts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  kind: text('kind').$type<QuickDiscountKind>().notNull(),
  value: real('value').notNull()
})

export const devices = sqliteTable(
  'devices',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    tokenHash: text('token_hash').notNull(),
    tokenSalt: text('token_salt').notNull(),
    lookupHash: text('lookup_hash'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    revokedAt: text('revoked_at')
  },
  (table) => [index('devices_lookup_hash_idx').on(table.lookupHash)]
)

export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    capabilities: text('capabilities', { mode: 'json' }).$type<AuthorityKey[]>().notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false)
  },
  // 複合唯一索引：允許不同租戶存在同名預設角色
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
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id),
    pinHash: text('pin_hash').notNull(),
    pinSalt: text('pin_salt').notNull(),
    failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
    lockedUntil: text('locked_until')
  },
  // 複合唯一索引：不同租戶的 account 可重複
  (table) => [uniqueIndex('staff_tenant_account_idx').on(table.tenantId, table.account)]
)

export const operatorSessions = sqliteTable(
  'operator_sessions',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    staffId: text('staff_id')
      .notNull()
      .references(() => staff.id),
    tokenHash: text('token_hash').notNull(),
    tokenSalt: text('token_salt').notNull(),
    // 允許 NULL：既有 session 只有 PBKDF2 雜湊、沒有明文可回補這欄
    lookupHash: text('lookup_hash'),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
    revokedAt: text('revoked_at')
  },
  (table) => [index('operator_sessions_lookup_hash_idx').on(table.lookupHash)]
)

export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  disabled: integer('disabled', { mode: 'boolean' }).notNull(),
  useMethod: text('use_method').$type<PaymentUseMethod>().notNull()
})

export const orders = sqliteTable(
  'orders',
  {
    orderId: text('order_id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    orderTime: text('order_time').notNull(),
    orderStatus: text('order_status').$type<OrderStatus>().notNull(),
    orderChannel: text('order_channel').$type<OrderChannel>().notNull().default('外帶'),
    staff: text('staff').notNull(),
    orderBagCount: integer('order_bag_count').notNull(),
    orderCupCount: integer('order_cup_count').notNull(),
    orderTotalPrice: integer('order_total_price').notNull(),
    orderPayment: text('order_payment').notNull(),
    orderDiscount: integer('order_discount').notNull(),
    orderPaymentPrice: integer('order_payment_price').notNull(),
    changeDue: integer('change_due').notNull().default(0),
    discountName: text('discount_name').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    voidReason: text('void_reason'),
    voidedBy: text('voided_by'),
    voidedAt: text('voided_at'),
    invoiceNumber: text('invoice_number').notNull().default(''),
    invoiceCarrierType: text('invoice_carrier_type')
      .$type<InvoiceCarrierType>()
      .notNull()
      .default('無載具'),
    invoiceCarrierValue: text('invoice_carrier_value'),
    memberId: text('member_id').references(() => members.id),
    pointsEarned: integer('points_earned').notNull().default(0),
    pointsRedeemed: integer('points_redeemed').notNull().default(0),
    invoiceStatus: text('invoice_status').$type<InvoiceStatus>().notNull().default('issued'),
    invoiceSubmittedAt: text('invoice_submitted_at'),
    tableNumber: text('table_number'),
    note: text('note')
  },
  (table) => [
    uniqueIndex('orders_tenant_idempotency_key_idx').on(table.tenantId, table.idempotencyKey),
    index('orders_tenant_order_time_idx').on(table.tenantId, table.orderTime),
    index('orders_tenant_order_status_idx').on(table.tenantId, table.orderStatus)
  ]
)

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').references(() => users.id),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    points: integer('points').notNull().default(0),
    birthday: text('birthday'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    notes: text('notes'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    // 軟刪除：避免 orders 與 member_point_ledger 關聯破壞外鍵約束
    deletedAt: text('deleted_at')
  },
  (table) => [uniqueIndex('members_tenant_phone_idx').on(table.tenantId, table.phone)]
)

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

export const memberTiers = sqliteTable('member_tiers', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  name: text('name').notNull(),
  minSpend: integer('min_spend').notNull()
})

export const orderSequences = sqliteTable(
  'order_sequences',
  {
    tenantId: text('tenant_id').references(() => users.id),
    businessDate: text('business_date').notNull(),
    counter: integer('counter').notNull()
  },
  // 複合主鍵：序號計數器按租戶與營業日獨立計算
  (table) => [primaryKey({ columns: [table.tenantId, table.businessDate] })]
)

export const invoiceSequences = sqliteTable('invoice_sequences', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  counter: integer('counter').notNull()
})

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
    quickDiscountId: text('quick_discount_id'),
    quickDiscountName: text('quick_discount_name').notNull().default('')
  },
  (table) => [index('order_lines_order_id_idx').on(table.orderId)]
)

export const orderTenders = sqliteTable(
  'order_tenders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tenantId: text('tenant_id').references(() => users.id),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.orderId),
    seq: integer('seq').notNull(),
    method: text('method').notNull(),
    amount: integer('amount').notNull(),
    receivedAmount: integer('received_amount')
  },
  (table) => [index('order_tenders_order_id_idx').on(table.orderId)]
)

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

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  status: text('status').$type<'open' | 'closed'>().notNull(),
  openedBy: text('opened_by').notNull(),
  openedAt: text('opened_at').notNull(),
  openingFloat: integer('opening_float').notNull(),
  closedBy: text('closed_by'),
  closedAt: text('closed_at'),
  cashSales: integer('cash_sales'),
  refunds: integer('refunds'),
  expectedCash: integer('expected_cash'),
  actualCash: integer('actual_cash'),
  variance: integer('variance')
})

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

export const rateLimitCounters = sqliteTable('rate_limit_counters', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull()
})

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tenantId: text('tenant_id').references(() => users.id),
    action: text('action').$type<AuditLogAction>().notNull(),
    operator: text('operator').notNull(),
    detail: text('detail').notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [index('audit_logs_tenant_created_at_idx').on(table.tenantId, table.createdAt)]
)

export const diningTables = sqliteTable('dining_tables', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => users.id),
  tableNumber: text('table_number').notNull(),
  seats: integer('seats').notNull(),
  status: text('status').$type<TableStatus>().notNull().default('empty'),
  note: text('note').notNull().default(''),
  guestCount: integer('guest_count'),
  occupiedAt: text('occupied_at'),
  reservationPhone: text('reservation_phone'),
  reservationTime: text('reservation_time')
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
