export interface QuickDiscount {
  id: string
  name: string
  kind: 'amount' | 'percent'
  value: number
}

export interface LineDiscountFlags {
  freeDiscount: boolean
  quickDiscountId: string | null
}

export const NO_DISCOUNT: LineDiscountFlags = {
  freeDiscount: false,
  quickDiscountId: null
}

export interface LineBase {
  price: number
  count: number
  addListPrice: number
}

export interface PricedLine {
  totalPrice: number
  discount: number
  quickDiscountName: string
}

export function priceLine(
  base: LineBase,
  flags: LineDiscountFlags,
  quickDiscounts: readonly QuickDiscount[]
): PricedLine {
  const originalPrice = base.price * base.count + base.addListPrice * base.count

  if (flags.freeDiscount) {
    return { totalPrice: 0, discount: originalPrice, quickDiscountName: '' }
  }

  const applied = flags.quickDiscountId
    ? quickDiscounts.find((d) => d.id === flags.quickDiscountId)
    : undefined
  if (!applied) {
    return { totalPrice: originalPrice, discount: 0, quickDiscountName: '' }
  }

  const totalPrice =
    applied.kind === 'amount'
      ? Math.max(0, originalPrice - applied.value * base.count)
      : Math.max(0, Math.round(originalPrice * applied.value))

  return { totalPrice, discount: originalPrice - totalPrice, quickDiscountName: applied.name }
}

export function toggleFree(flags: LineDiscountFlags): LineDiscountFlags {
  return { freeDiscount: !flags.freeDiscount, quickDiscountId: null }
}

export function toggleQuickDiscount(flags: LineDiscountFlags, id: string): LineDiscountFlags {
  return { ...flags, quickDiscountId: flags.quickDiscountId === id ? null : id }
}
