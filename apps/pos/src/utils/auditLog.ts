import type { AuditLogAction } from '@pos/contract'

/** 操作紀錄動作的中文顯示文字與分組，供篩選下拉選單與列表欄位使用。 */
export const AUDIT_ACTION_LABELS: Record<AuditLogAction, string> = {
  cashier_open: '開啟收銀機',
  'staff.create': '新增員工',
  'staff.update': '更新員工',
  'staff.delete': '刪除員工',
  'role.create': '新增權限群組',
  'role.update': '更新權限群組',
  'role.delete': '刪除權限群組',
  'device.revoke': '撤銷裝置憑證',
  'category.create': '新增分類',
  'category.update': '更新分類',
  'category.delete': '刪除分類',
  'product.create': '新增品項',
  'product.update': '更新品項',
  'product.delete': '刪除品項',
  'modifierGroup.create': '新增規格群組',
  'modifierGroup.update': '更新規格群組',
  'modifierGroup.delete': '刪除規格群組',
  'orderCoupon.create': '新增訂單折價券',
  'orderCoupon.update': '更新訂單折價券',
  'orderCoupon.delete': '刪除訂單折價券',
  'quickDiscount.create': '新增快速折扣',
  'quickDiscount.update': '更新快速折扣',
  'quickDiscount.delete': '刪除快速折扣',
  'paymentMethod.create': '新增付款方式',
  'paymentMethod.update': '更新付款方式',
  'paymentMethod.delete': '刪除付款方式',
  'tenantSettings.update': '更新營業設定',
  'member.create': '新增會員',
  'member.update': '更新會員',
  'member.delete': '刪除會員',
  'member.pointsAdjust': '調整會員點數',
  'memberTier.create': '新增會員分級',
  'memberTier.update': '更新會員分級',
  'memberTier.delete': '刪除會員分級',
  'table.create': '新增桌位',
  'table.update': '更新桌位',
  'table.delete': '刪除桌位',
  'order.void': '作廢訂單',
  'order.refund': '訂單退款',
  'order.delete': '刪除訂單',
  'shift.open': '開班別',
  'shift.close': '收班',
  'shift.cashMovement': '現金存入/提領'
}

/** 篩選下拉選單用的分組，對應各業務路由所屬模組，順序即畫面顯示順序。 */
export interface AuditActionGroup {
  title: string
  actions: AuditLogAction[]
}
export const AUDIT_ACTION_GROUPS: AuditActionGroup[] = [
  { title: '收銀', actions: ['cashier_open'] },
  {
    title: '人員與權限',
    actions: [
      'staff.create',
      'staff.update',
      'staff.delete',
      'role.create',
      'role.update',
      'role.delete',
      'device.revoke'
    ]
  },
  {
    title: '後台設定',
    actions: [
      'category.create',
      'category.update',
      'category.delete',
      'product.create',
      'product.update',
      'product.delete',
      'modifierGroup.create',
      'modifierGroup.update',
      'modifierGroup.delete',
      'orderCoupon.create',
      'orderCoupon.update',
      'orderCoupon.delete',
      'quickDiscount.create',
      'quickDiscount.update',
      'quickDiscount.delete',
      'paymentMethod.create',
      'paymentMethod.update',
      'paymentMethod.delete',
      'tenantSettings.update'
    ]
  },
  {
    title: '會員',
    actions: [
      'member.create',
      'member.update',
      'member.delete',
      'member.pointsAdjust',
      'memberTier.create',
      'memberTier.update',
      'memberTier.delete'
    ]
  },
  { title: '桌況', actions: ['table.create', 'table.update', 'table.delete'] },
  { title: '訂單', actions: ['order.void', 'order.refund', 'order.delete'] },
  { title: '班別／現金', actions: ['shift.open', 'shift.close', 'shift.cashMovement'] }
]
