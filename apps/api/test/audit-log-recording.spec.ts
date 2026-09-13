import { describe, expect, it } from 'vitest'
import type { AuditLogAction } from '@pos/contract'
import { createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedPromotions } from './helpers/promotions'
import { seedRole } from './helpers/roles'
import { devices, invoiceTracks } from '../src/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 測試只做屬性斷言，不需要完整型別
async function readJson(res: Response): Promise<any> {
  return res.json()
}

/**
 * 驗證每個埋有 recordAuditLog() 呼叫的路由，執行後都能在 GET /api/audit-logs
 * 查到對應的 action。刻意用單一測試依序執行、共用同一組裝置/操作員 session，
 * 避免每個模組各自重建 app／裝置／促銷字軌等前置資料——這裡只在乎「有沒有
 * 記到」，不重複各業務路由自己 *.spec.ts 已經涵蓋的商業邏輯正確性。
 *
 * 登入/登出相關的 staff.login／staff.loginFailed／staff.logout／device.issue
 * 不在這裡涵蓋，改由 auth.spec.ts／devices.spec.ts 各自驗證——這幾個動作
 * 跟這裡統一沿用的「同一組裝置＋操作員」前提衝突（登入/登出本身就是在
 * 建立/撤銷這組身分；device.issue 落在未分配租戶過渡池，不是這裡用的
 * tenant-1）。auth.oauthLogin 需要真的走一次 Google／GitHub OAuth，
 * routes/oauth.ts 目前完全沒有路由測試（連結不到測試用的 provider），
 * 沿用既有邊界不強加。
 */
describe('操作紀錄：各業務路由的異動都寫入 audit_logs', () => {
  it('人員/權限/裝置、後台型錄、促銷、付款方式、營業設定、會員、桌況、訂單、班別的異動都留下對應紀錄', async () => {
    const db = createTestDb()
    await seedPromotions(db)
    // 掛實體租戶（不是過渡期的 null tenantId）：tenant-settings 的更新需要
    // 查得到對應的 users 列（見 routes/tenant-settings.ts），createTestAppWithDevice
    // 帶 tenantId 時會一併種好這筆 users 資料——invoiceTracks 的外鍵指到
    // users.id，一定要先呼叫這個才能接著插入 tenant-1 的字軌。
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db, 'test-device', {
      tenantId: 'tenant-1'
    })
    // seedPromotions() 的發票字軌 tenantId 是 null，掛實體租戶 tenant-1 送單
    // 需要自己的字軌，理由同 orders.spec.ts 的 seedInvoiceTrackForTenant()。
    await db.insert(invoiceTracks).values({
      id: 'track-tenant-1',
      tenantId: 'tenant-1',
      trackCode: 'AA',
      periodLabel: '測試期別',
      rangeStart: 1,
      rangeEnd: 50000000,
      currentNumber: 0,
      isActive: true
    })
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Token': deviceToken,
      'X-Operator-Session': sessionToken
    }

    // 人員與權限
    const role = await readJson(
      await app.request('/api/roles', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '外場', capabilities: ['canCheckOrder'] })
      })
    )
    await app.request(`/api/roles/${role.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '外場', capabilities: ['canCheckOrder', 'canEditOrderStatus'] })
    })
    await app.request(`/api/roles/${role.id}`, { method: 'DELETE', headers })

    const staffRoleId = await seedRole(db, { capabilities: ['canCheckOrder'], tenantId: 'tenant-1' })
    const employee = await readJson(
      await app.request('/api/staff', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Emily',
          jobTitle: '工讀生',
          account: 'emily',
          roleId: staffRoleId,
          pin: '3456'
        })
      })
    )
    await app.request(`/api/staff/${employee.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Emily Chen',
        jobTitle: '工讀生',
        account: 'emily',
        roleId: staffRoleId
      })
    })
    await app.request(`/api/staff/${employee.id}`, { method: 'DELETE', headers })

    // 裝置：核發端點固定核發到「未分配租戶」的過渡池（見 routes/devices.ts），
    // 沒辦法指定 tenantId，直接寫入 db 掛到 tenant-1 才能被同租戶的 session 撤銷。
    const deviceToRevokeId = crypto.randomUUID()
    await db.insert(devices).values({
      id: deviceToRevokeId,
      tenantId: 'tenant-1',
      name: '外帶自取機',
      tokenHash: 'irrelevant-for-this-test',
      tokenSalt: 'irrelevant-for-this-test',
      createdAt: new Date().toISOString(),
      revokedAt: null
    })
    await app.request(`/api/devices/${deviceToRevokeId}/revoke`, { method: 'POST', headers })

    // 後台型錄：分類／品項／規格群組
    const category = await readJson(
      await app.request('/api/catalog/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '主餐' })
      })
    )
    await app.request(`/api/catalog/categories/${category.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '主餐類' })
    })
    const group = await readJson(
      await app.request('/api/catalog/modifier-groups', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '甜度', selectionType: 'single', required: false, options: [] })
      })
    )
    await app.request(`/api/catalog/modifier-groups/${group.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '甜度選擇', selectionType: 'single', required: false, options: [] })
    })
    await app.request(`/api/catalog/modifier-groups/${group.id}`, { method: 'DELETE', headers })
    const product = await readJson(
      await app.request('/api/catalog/products', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          categoryId: category.id,
          name: '招牌牛肉漢堡',
          basePrice: 180,
          stock: null,
          modifierGroupIds: []
        })
      })
    )
    await app.request(`/api/catalog/products/${product.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        categoryId: category.id,
        name: '招牌牛肉漢堡（加大）',
        basePrice: 220,
        stock: null,
        modifierGroupIds: []
      })
    })
    await app.request(`/api/catalog/products/${product.id}`, { method: 'DELETE', headers })
    await app.request(`/api/catalog/categories/${category.id}`, { method: 'DELETE', headers })

    // 促銷：訂單折價券／快速折扣
    const coupon = await readJson(
      await app.request('/api/promotions/order-coupons', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '$80折價券', kind: 'amount', value: 80 })
      })
    )
    await app.request(`/api/promotions/order-coupons/${coupon.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '$100折價券', kind: 'amount', value: 100 })
    })
    await app.request(`/api/promotions/order-coupons/${coupon.id}`, { method: 'DELETE', headers })
    const quick = await readJson(
      await app.request('/api/promotions/quick-discounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '生日優惠', kind: 'percent', value: 0.8 })
      })
    )
    await app.request(`/api/promotions/quick-discounts/${quick.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '生日優惠88折', kind: 'percent', value: 0.88 })
    })
    await app.request(`/api/promotions/quick-discounts/${quick.id}`, { method: 'DELETE', headers })

    // 付款方式
    const payMethod = await readJson(
      await app.request('/api/payment-methods', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '現金', disabled: false, useMethod: '紙鈔' })
      })
    )
    await app.request(`/api/payment-methods/${payMethod.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '現金', disabled: true, useMethod: '紙鈔' })
    })
    await app.request(`/api/payment-methods/${payMethod.id}`, { method: 'DELETE', headers })

    // 營業設定
    await app.request('/api/tenant-settings', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ businessDayStartHour: 6 })
    })

    // 會員與會員分級
    const member = await readJson(
      await app.request('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '王小明', phone: '0912345678' })
      })
    )
    await app.request(`/api/members/${member.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '王小明（已改名）', phone: '0912345678' })
    })
    await app.request(`/api/members/${member.id}/points-adjustments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ delta: 10, reason: '活動加碼', operator: '店長 - Lemon' })
    })
    await app.request(`/api/members/${member.id}`, { method: 'DELETE', headers })
    const tier = await readJson(
      await app.request('/api/member-tiers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: '金卡會員', minSpend: 10000 })
      })
    )
    await app.request(`/api/member-tiers/${tier.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: '金卡會員', minSpend: 15000 })
    })
    await app.request(`/api/member-tiers/${tier.id}`, { method: 'DELETE', headers })

    // 桌況
    const table = await readJson(
      await app.request('/api/tables', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tableNumber: 'A1', seats: 4 })
      })
    )
    await app.request(`/api/tables/${table.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ tableNumber: 'A1', seats: 6 })
    })
    await app.request(`/api/tables/${table.id}`, { method: 'DELETE', headers })

    // 訂單：作廢／退款／刪除
    const order = await readJson(
      await app.request('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          businessDate: '20260101',
          staff: '店長 - Lemon',
          lines: [
            {
              name: '楊枝甘露2.0',
              price: 80,
              count: 1,
              addList: '無添加配料',
              addListPrice: 0,
              freeDiscount: false,
              quickDiscountId: null
            }
          ],
          bagCount: 0,
          tenders: [{ method: '現金', amount: 80 }],
          appliedCoupon: { type: 'none' },
          orderChannel: '外帶',
          invoiceCarrier: { type: '無載具' }
        })
      })
    )
    await app.request(`/api/orders/${order.orderId}/refunds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refundId: '01ARZ3NDEKTSV4RRFFQ69G5FA1', amount: 20, operator: '店長 - Lemon', reason: '少一杯' })
    })
    await app.request(`/api/orders/${order.orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus: '已取消', operator: '店長 - Lemon', reason: '客人取消' })
    })
    await app.request(`/api/orders/${order.orderId}`, { method: 'DELETE', headers })

    // 班別：開帳／現金異動／收班
    const shiftId = '01ARZ3NDEKTSV4RRFFQ69G5FBV'
    await app.request('/api/shifts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ shiftId, operator: '店長 - Lemon', openingFloat: 3000 })
    })
    await app.request(`/api/shifts/${shiftId}/cash-movements`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'in', amount: 500, operator: '店長 - Lemon', reason: '補零錢' })
    })
    await app.request(`/api/shifts/${shiftId}/close`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operator: '店長 - Lemon', actualCash: 3500 })
    })

    const list = await readJson(
      await app.request('/api/audit-logs?pageSize=100', { headers })
    )
    const recordedActions = new Set(list.items.map((row: { action: AuditLogAction }) => row.action))

    const expectedActions: AuditLogAction[] = [
      'staff.create',
      'staff.update',
      'staff.delete',
      'role.create',
      'role.update',
      'role.delete',
      'device.revoke',
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
      'tenantSettings.update',
      'member.create',
      'member.update',
      'member.pointsAdjust',
      'member.delete',
      'memberTier.create',
      'memberTier.update',
      'memberTier.delete',
      'table.create',
      'table.update',
      'table.delete',
      'order.refund',
      'order.void',
      'order.delete',
      'shift.open',
      'shift.cashMovement',
      'shift.close'
    ]
    for (const action of expectedActions) {
      expect(recordedActions.has(action), `缺少 action: ${action}`).toBe(true)
    }
  })
})
