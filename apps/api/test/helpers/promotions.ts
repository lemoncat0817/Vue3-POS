import { invoiceTracks, moneyCoupons, oftenUseRates, percentCoupons } from '../../src/db/schema'
import type { AnyDb } from '../../src/db/types'

/**
 * 跟 apps/api/seed/promotions.sql 相同的內容，供測試使用——常用折扣
 * （often_use_rates）是送單時 loadOftenUseRates() 的必要資料，缺任何一
 * 個 slot 都會讓送單失敗（見 routes/orders.ts 的設計說明），測試建立
 * 訂單前一定要先呼叫這個函式。
 *
 * P23（規劃書 §10 P23「電子發票平台串接」）：送單也需要一個啟用中的
 * 發票字軌才能核發發票號碼（見 routes/orders.ts 的 nextInvoiceNumber）
 * ——沒有字軌會讓送單回 400，這裡一併補上一個測試用的預設字軌，
 * 沿用「這個函式是送單測試的必要前置資料」這個既有定位，不是另外
 * 混進一個不相干的職責。
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
  await db.insert(invoiceTracks).values([
    { id: 'track-1', trackCode: 'AA', periodLabel: '測試期別', rangeStart: 1, rangeEnd: 50000000, currentNumber: 0, isActive: true },
  ])
}
