import type { FormNumeric } from './common'

/** 現金折價券（例如「$50折價券」）。 */
export interface MoneyDiscount {
  id: FormNumeric
  name: string
  discountMoney: FormNumeric
}

// 折數折價券（欄位沿用既有命名 discountMoney 存折數）。
export interface PercentDiscount {
  id: FormNumeric
  name: string
  discountMoney: FormNumeric
}

/** 快速折扣（常客優惠、員工優惠……），後台可自由新增/刪除任意筆數。 */
export interface QuickDiscount {
  id: FormNumeric
  name: string
  kind: 'amount' | 'percent'
  value: FormNumeric
}
