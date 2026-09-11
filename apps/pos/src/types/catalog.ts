import type { FormNumeric } from './common'

/** `ModifierGroup.selectionType`：單選或多選。 */
export type ModifierSelectionType = 'single' | 'multiple'

/** 規格群組單一選項（例如「大杯」「五分熟」），可帶加減價。 */
export interface ModifierOption {
  id: FormNumeric
  name: string
  priceDelta: FormNumeric
}

/** 規格群組（例如「甜度」「熟度」「容器大小」），全域定義後可掛在任意數量的品項上。 */
export interface ModifierGroup {
  id: FormNumeric
  name: string
  selectionType: ModifierSelectionType
  required: boolean
  options: ModifierOption[]
}

/** 單一品項，不綁定特定餐飲品類——客製化選項透過 modifierGroupIds 掛用規格群組表達。 */
export interface Product {
  id: FormNumeric
  categoryId: FormNumeric
  name: string
  basePrice: FormNumeric
  /** 庫存數量。`null` 或未提供代表不追蹤庫存。 */
  stock?: number | null
  modifierGroupIds: FormNumeric[]
}

/** 一個分類（例如「主餐」「飲品」），底下掛品項。 */
export interface Category {
  id: FormNumeric
  name: string
}

/** 加購選項——後台可新增／編輯，因此 id 與 price 需容納表單輸入的字串。 */
export interface AddOnOption {
  id: FormNumeric
  name: string
  price: FormNumeric
  /** 庫存數量，見 Product.stock 的說明。 */
  stock?: number | null
}

/** 點餐畫面選好某個規格群組後記錄的選擇，供組裝購物車品名字串與計算加價。 */
export interface SelectedModifier {
  groupId: FormNumeric
  groupName: string
  optionId: FormNumeric
  optionName: string
  priceDelta: FormNumeric
}

/** 待付款清單／歷史訂單的單一品項列（購物車與 orderData 共用形狀）。 */
export interface CartLineItem {
  id: number
  name: string
  /** 定價可能來自表單新增的品項，因此與目錄同樣是 FormNumeric。 */
  price: FormNumeric
  count: number
  discount: number
  /** 種子資料中此欄位並存字串與陣列兩種形狀。 */
  addList: string | string[]
  addListPrice: number
  totalPrice: number
  freeDiscount: boolean
  /** 套用哪一筆快速折扣，沒套用是 null。 */
  quickDiscountId: string | null
  quickDiscountName: string
  /** 供購物車就地規格再編輯用的快照（選填，避免影響伺服端契約） */
  productId?: string
  selectedModifiers?: Record<string, string[]>
  selectedAddOnIds?: string[]
}
