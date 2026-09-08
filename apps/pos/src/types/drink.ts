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
  /**
   * 庫存數量（P20：規劃書 §10 P20「基礎庫存管理」）。`null`／缺少這個
   * 欄位代表不追蹤庫存——選填而不是必填，是因為 stores/drink.ts 裡
   * 大量寫死的離線種子資料（見該檔案的說明）本來就沒有這個概念，
   * 逐一補上沒有意義；伺服端回應一律會帶這個欄位（見 api/catalog.ts
   * 的 toDrinkTypeGroups）。
   */
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

/**
 * 待付款清單／歷史訂單的單一品項列。
 *
 * `drinkStore.drinkNotPay` 的項目在送出訂單時會被直接指派給
 * `order.orderData`（`orderData: drinkStore.drinkNotPay`），兩處共用同一個
 * 執行期形狀，因此以同一個介面表示。
 */
export interface CartLineItem {
  id: number
  name: string
  /** 定價可能來自表單新增的飲料品項，因此與目錄同樣是 FormNumeric。 */
  price: FormNumeric
  size: string
  count: number
  discount: number
  /**
   * 種子資料裡這個欄位同時出現字串（"無添加配料"）與陣列
   * （["芝芝"]）兩種形狀——如實記錄，不在 P0 正規化。
   */
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
