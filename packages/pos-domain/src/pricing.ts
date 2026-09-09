/**
 * 單一品項折扣計價邏輯。
 * 純函式每次從當前旗標完整重算衍生欄位，避免順序依賴與狀態殘留。
 */

/** 常用折扣的定額或折數設定值（已轉換為 number，不是表單輸入的字串）。 */
export interface OftenUseDiscountRate {
  name: string
  discountMoney: number
  discountPercent: number
}

/**
 * 五筆常用折扣的固定順序，對應既有畫面的按鈕與資料索引：
 * [0] 環保折扣、[1] 瓶裝折扣（兩者互斥，屬「容器」群組）、
 * [2] 九折、[3] 八五折、[4] 員工八折（三者互斥，屬「折數」群組）。
 */
export type OftenUseRates = readonly [
  OftenUseDiscountRate,
  OftenUseDiscountRate,
  OftenUseDiscountRate,
  OftenUseDiscountRate,
  OftenUseDiscountRate,
]

/** 一個品項目前套用的折扣旗標——與 CartLineItem 的對應欄位一一對應。 */
export interface LineDiscountFlags {
  freeDiscount: boolean
  ecoDiscount: boolean
  bottleDiscount: boolean
  oftenUseDiscount1: boolean
  oftenUseDiscount2: boolean
  oftenUseDiscount3: boolean
}

/** 沒有套用任何折扣的初始狀態。 */
export const NO_DISCOUNT: LineDiscountFlags = {
  freeDiscount: false,
  ecoDiscount: false,
  bottleDiscount: false,
  oftenUseDiscount1: false,
  oftenUseDiscount2: false,
  oftenUseDiscount3: false,
}

/** 計價所需的品項基本資料（單價、數量、配料加總金額）。 */
export interface LineBase {
  price: number
  count: number
  addListPrice: number
}

/** `priceLine()` 算出的衍生欄位，對應 CartLineItem 的計價相關欄位。 */
export interface PricedLine {
  totalPrice: number
  discount: number
  currentDiscountMoney: number
  currentDiscountPercent: number
  useDiscountMoney: string
  useDiscountPercent: string
  useDiscountFree: string
}

/** 依折扣旗標計算金額。優先序：招待 > 容器定額折扣 > 折數折扣；結果箝制不為負。 */
export function priceLine(base: LineBase, flags: LineDiscountFlags, oftenUse: OftenUseRates): PricedLine {
  const originalPrice = base.price * base.count + base.addListPrice * base.count

  if (flags.freeDiscount) {
    return {
      totalPrice: 0,
      discount: originalPrice,
      currentDiscountMoney: 0,
      currentDiscountPercent: 0,
      useDiscountMoney: '',
      useDiscountPercent: '',
      useDiscountFree: '招待',
    }
  }

  const container = flags.ecoDiscount ? oftenUse[0] : flags.bottleDiscount ? oftenUse[1] : undefined
  const rate = flags.oftenUseDiscount1
    ? oftenUse[2]
    : flags.oftenUseDiscount2
      ? oftenUse[3]
      : flags.oftenUseDiscount3
        ? oftenUse[4]
        : undefined

  const currentDiscountMoney = container?.discountMoney ?? 0
  const currentDiscountPercent = rate?.discountPercent ?? 1
  const totalPrice = Math.max(
    0,
    Math.round((originalPrice - currentDiscountMoney * base.count) * currentDiscountPercent),
  )

  return {
    totalPrice,
    discount: originalPrice - totalPrice,
    currentDiscountMoney,
    currentDiscountPercent,
    useDiscountMoney: container?.name ?? '',
    useDiscountPercent: rate?.name ?? '',
    useDiscountFree: '',
  }
}

/** 切換「招待」。招待與其他所有折扣互斥，切換時重置其餘旗標以防殘留舊狀態。 */
export function toggleFree(flags: LineDiscountFlags): LineDiscountFlags {
  return { ...NO_DISCOUNT, freeDiscount: !flags.freeDiscount }
}

/** 容器折扣群組（環保杯／瓶裝）彼此互斥，切換其中一個會關閉另一個。 */
export function toggleContainer(flags: LineDiscountFlags, which: 'eco' | 'bottle'): LineDiscountFlags {
  if (which === 'eco') {
    return { ...flags, ecoDiscount: !flags.ecoDiscount, bottleDiscount: false }
  }
  return { ...flags, bottleDiscount: !flags.bottleDiscount, ecoDiscount: false }
}

/** 折數折扣群組（九折／八五折／員工八折）三者互斥。 */
export function toggleRate(flags: LineDiscountFlags, which: 1 | 2 | 3): LineDiscountFlags {
  const next = { ...flags, oftenUseDiscount1: false, oftenUseDiscount2: false, oftenUseDiscount3: false }
  if (which === 1) next.oftenUseDiscount1 = !flags.oftenUseDiscount1
  if (which === 2) next.oftenUseDiscount2 = !flags.oftenUseDiscount2
  if (which === 3) next.oftenUseDiscount3 = !flags.oftenUseDiscount3
  return next
}
