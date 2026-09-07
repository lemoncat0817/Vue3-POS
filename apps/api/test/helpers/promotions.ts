import { moneyCoupons, oftenUseRates, percentCoupons } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'

/**
 * 跟 apps/api/seed/promotions.sql 相同的內容，供測試使用——常用折扣
 * （often_use_rates）是送單時 loadOftenUseRates() 的必要資料，缺任何一
 * 個 slot 都會讓送單失敗（見 routes/orders.ts 的設計說明），測試建立
 * 訂單前一定要先呼叫這個函式。
 */
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
}
