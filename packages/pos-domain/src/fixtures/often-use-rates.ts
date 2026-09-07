import type { OftenUseRates } from '../pricing'

/**
 * 對照 apps/pos/src/stores/discount.ts 的預設常用折扣種子資料，供領域
 * 層測試使用，不需要額外依賴 apps/pos 才能取得這份設定值。
 */
export const DEFAULT_OFTEN_USE_RATES: OftenUseRates = [
  { name: '環保折扣', discountMoney: 5, discountPercent: 1 },
  { name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
  { name: '九折', discountMoney: 0, discountPercent: 0.9 },
  { name: '八五折', discountMoney: 0, discountPercent: 0.85 },
  { name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
]
