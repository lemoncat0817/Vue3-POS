import { invoiceTracks, orderCoupons, quickDiscounts } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'

export async function seedPromotions(db: AnyDb): Promise<void> {
  await db.insert(quickDiscounts).values([
    { id: 'quick-1', name: '常客優惠', kind: 'amount', value: 5 },
    { id: 'quick-2', name: '大宗採購優惠', kind: 'amount', value: 10 },
    { id: 'quick-3', name: '九折優惠', kind: 'percent', value: 0.9 }
  ])
  await db.insert(orderCoupons).values([
    { id: 'money-1', name: '$50折價券', kind: 'amount', value: 50 },
    { id: 'money-2', name: '滿$300折$100元', kind: 'amount', value: 100 },
    { id: 'percent-1', name: '整單95折', kind: 'percent', value: 0.95 }
  ])
  await db.insert(invoiceTracks).values([
    {
      id: 'track-1',
      trackCode: 'AA',
      periodLabel: '測試期別',
      rangeStart: 1,
      rangeEnd: 50000000,
      currentNumber: 0,
      isActive: true
    }
  ])
}
