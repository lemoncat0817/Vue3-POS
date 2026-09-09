/**
 * 單一品項折扣計價邏輯。
 * 純函式每次從當前旗標完整重算衍生欄位，避免順序依賴與狀態殘留。
 */

/** 快速折扣設定值（已轉換為 number，不是表單輸入的字串）。 */
export interface QuickDiscount {
  id: string
  name: string
  /** amount：每份扣減固定金額；percent：整體乘上折數（0~1）。 */
  kind: 'amount' | 'percent'
  value: number
}

/** 一個品項目前套用的折扣旗標——與 CartLineItem 的對應欄位一一對應。 */
export interface LineDiscountFlags {
  /** 招待（comp）：跟具名快速折扣互斥，優先於快速折扣生效。 */
  freeDiscount: boolean
  /** 套用哪一筆快速折扣，沒套用是 null；同一時間只能套用一筆。 */
  quickDiscountId: string | null
}

/** 沒有套用任何折扣的初始狀態。 */
export const NO_DISCOUNT: LineDiscountFlags = {
  freeDiscount: false,
  quickDiscountId: null,
}

/** 計價所需的品項基本資料（單價、數量、加購項目加總金額）。 */
export interface LineBase {
  price: number
  count: number
  addListPrice: number
}

/** `priceLine()` 算出的衍生欄位，對應 CartLineItem 的計價相關欄位。 */
export interface PricedLine {
  totalPrice: number
  discount: number
  /** 套用的快速折扣名稱，沒套用或已招待則為空字串。 */
  quickDiscountName: string
}

/** 依折扣旗標計算金額。優先序：招待 > 快速折扣；結果箝制不為負。 */
export function priceLine(base: LineBase, flags: LineDiscountFlags, quickDiscounts: readonly QuickDiscount[]): PricedLine {
  const originalPrice = base.price * base.count + base.addListPrice * base.count

  if (flags.freeDiscount) {
    return { totalPrice: 0, discount: originalPrice, quickDiscountName: '' }
  }

  const applied = flags.quickDiscountId ? quickDiscounts.find((d) => d.id === flags.quickDiscountId) : undefined
  if (!applied) {
    return { totalPrice: originalPrice, discount: 0, quickDiscountName: '' }
  }

  const totalPrice =
    applied.kind === 'amount'
      ? Math.max(0, originalPrice - applied.value * base.count)
      : Math.max(0, Math.round(originalPrice * applied.value))

  return { totalPrice, discount: originalPrice - totalPrice, quickDiscountName: applied.name }
}

/** 切換「招待」。招待與快速折扣互斥，切換時清空已選的快速折扣以防殘留舊狀態。 */
export function toggleFree(flags: LineDiscountFlags): LineDiscountFlags {
  return { freeDiscount: !flags.freeDiscount, quickDiscountId: null }
}

/** 切換某一筆快速折扣：同一時間只能套用一筆，選同一筆等於取消，選別筆會直接取代。 */
export function toggleQuickDiscount(flags: LineDiscountFlags, id: string): LineDiscountFlags {
  return { ...flags, quickDiscountId: flags.quickDiscountId === id ? null : id }
}
