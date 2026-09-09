import { invoiceTracks, moneyCoupons, oftenUseRates, percentCoupons } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'

/** 測試用促銷與發票字軌前置資料；常用折扣與啟用中字軌為送單必要條件。 */
export async function seedPromotions(db: AnyDb): Promise<void> {
  await db.insert(oftenUseRates).values([
    { slot: 0, name: '環保折扣', discountMoney: 5, discountPercent: 1 },
    { slot: 1, name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
    { slot: 2, name: '九折', discountMoney: 0, discountPercent: 0.9 },
    { slot: 3, name: '八五折', discountMoney: 0, discountPercent: 0.85 },
    { slot: 4, name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
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
