import type { OftenUseRates } from '../pricing'

/** 常用折扣預設值，供領域層測試獨立使用以避免依賴應用層。 */
export const DEFAULT_OFTEN_USE_RATES: OftenUseRates = [
  { name: '環保折扣', discountMoney: 5, discountPercent: 1 },
  { name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
  { name: '九折', discountMoney: 0, discountPercent: 0.9 },
  { name: '八五折', discountMoney: 0, discountPercent: 0.85 },
  { name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
]
