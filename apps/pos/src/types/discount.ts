import type { FormNumeric } from './common'

/** 現金折價券（例如「$50折價券」）。 */
export interface MoneyDiscount {
  id: FormNumeric
  name: string
  discountMoney: FormNumeric
}

/**
 * 折數折價券（例如「整單95折」）。
 *
 * 欄位沿用種子資料的命名：即使代表的是折數（0.95），欄位名稱仍是
 * `discountMoney`，與 {@link MoneyDiscount} 同名但意義不同——這是既有資料
 * 的命名方式，P0 如實保留，不重新命名。
 */
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

/**
 * 常用折扣固定是 5 筆（環保杯、瓶裝、九折、八五折、員工八折），後台只能
 * 編輯內容、不能新增或刪除（見 offerSetting.vue 沒有對應的新增/刪除功能）。
 * 標成固定長度的 tuple，讓 `oftenUseDiscount[0]`～`[4]` 這類以字面索引
 * 存取的地方（home/index.vue 的六個折扣函式）不必因
 * `noUncheckedIndexedAccess` 而多包一層 undefined 判斷。
 */
export type OftenUseDiscountList = [
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
  OftenUseDiscount,
]
