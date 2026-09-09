import type { FormNumeric } from './common'

/** `drinkList[].customized`：決定該品項可否客製化糖冰與容器大小。 */
export type DrinkCustomized = 'none' | 'cold' | 'both'

/** 單一茶類／飲料品項。 */
export interface DrinkListItem {
  id: FormNumeric
  name: string
  /** 不支援大杯／瓶裝時以字面值 `'none'` 表示，而不是缺少該欄位。 */
  priceL: FormNumeric | 'none'
  priceBottle: FormNumeric | 'none'
  customized: DrinkCustomized
  /** 庫存數量。`null` 或未提供代表不追蹤庫存。 */
  stock?: number | null
}

/** 一組飲料系列（例如「季節限定」）。 */
export interface DrinkTypeGroup {
  id: FormNumeric
  name: string
  type: string
  drinkList: DrinkListItem[]
}

/** 冰塊／糖度／容器大小選項——僅供選單顯示，後台無 CRUD，故 id 維持 number。 */
export interface DrinkSimpleOption {
  id: number
  name: string
}

/** 加料選項——後台可新增／編輯，因此 id 與 price 需容納表單輸入的字串。 */
export interface DrinkAddOnOption {
  id: FormNumeric
  name: string
  price: FormNumeric
  /** 庫存數量，見 DrinkListItem.stock 的說明。 */
  stock?: number | null
}

/** 待付款清單／歷史訂單的單一品項列（購物車與 orderData 共用形狀）。 */
export interface CartLineItem {
  id: number
  name: string
  /** 定價可能來自表單新增的飲料品項，因此與目錄同樣是 FormNumeric。 */
  price: FormNumeric
  size: string
  count: number
  discount: number
  /** 種子資料中此欄位並存字串與陣列兩種形狀。 */
  addList: string | string[]
  addListPrice: number
  totalPrice: number
  currentDiscountPercent: number
  currentDiscountMoney: number
  useDiscountPercent: string
  useDiscountMoney: string
  useDiscountFree: string
  freeDiscount: boolean
  ecoDiscount: boolean
  bottleDiscount: boolean
  oftenUseDiscount1: boolean
  oftenUseDiscount2: boolean
  oftenUseDiscount3: boolean
}
