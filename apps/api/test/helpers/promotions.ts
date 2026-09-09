import { invoiceTracks, moneyCoupons, percentCoupons, quickDiscounts } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'

/** 測試用促銷與發票字軌前置資料；快速折扣與啟用中字軌為送單必要條件。 */
export async function seedPromotions(db: AnyDb): Promise<void> {
  await db.insert(quickDiscounts).values([
    { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
    { id: 'quick-2', name: '大宗採購優惠', kind: 'amount', value: 10 },
    { id: 'quick-3', name: '九折優惠', kind: 'percent', value: 0.9 },
  ])
  await db.insert(moneyCoupons).values([
    { id: 'money-1', name: '$50折價券', discountMoney: 50 },
    { id: 'money-2', name: '滿$300折$100元', discountMoney: 100 },
  ])
  await db.insert(percentCoupons).values([{ id: 'percent-1', name: '整單95折', discountPercent: 0.95 }])
  await db.insert(invoiceTracks).values([
    { id: 'track-1', trackCode: 'AA', periodLabel: '測試期別', rangeStart: 1, rangeEnd: 50000000, currentNumber: 0, isActive: true },
  ])
}
