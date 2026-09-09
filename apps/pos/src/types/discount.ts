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

/** 常用折扣（環保杯、瓶裝、九折…），可同時帶定額與折數兩種折抵方式。 */
export interface OftenUseDiscount {
  id: FormNumeric
  name: string
  discountMoney: FormNumeric
  discountPercent: FormNumeric
}

// 常用折扣固定為 5 筆，標為固定長度 tuple 避免索引存取時產生 undefined 檢查。
export type OftenUseDiscountList = [
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
]
