import type { OftenUseRates } from '@pos/domain'

/**
 * 常用折扣的目前設定值，對照 apps/pos/src/stores/discount.ts 現行的
 * 種子資料。促銷規則之後應該是資料驅動、可由後台編輯（見重構規劃書
 * §10 P1 促銷引擎），現階段先固定在程式碼中，讓 POST /api/orders 能
 * 用同一份規則重算金額。
 */
export const CURRENT_OFTEN_USE_RATES: OftenUseRates = [
  { name: '環保折扣', discountMoney: 5, discountPercent: 1 },
  { name: '瓶裝折扣', discountMoney: 10, discountPercent: 1 },
  { name: '九折', discountMoney: 0, discountPercent: 0.9 },
  { name: '八五折', discountMoney: 0, discountPercent: 0.85 },
  { name: '員工八折', discountMoney: 0, discountPercent: 0.8 },
]
