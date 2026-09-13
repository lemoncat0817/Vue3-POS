import type { FormNumeric } from './common'

export type ModifierSelectionType = 'single' | 'multiple'

export interface ModifierOption {
  id: FormNumeric
  name: string
  priceDelta: FormNumeric
  stock?: number | null
}

export interface ModifierGroup {
  id: FormNumeric
  name: string
  selectionType: ModifierSelectionType
  required: boolean
  options: ModifierOption[]
}

export interface Product {
  id: FormNumeric
  categoryId: FormNumeric
  name: string
  basePrice: FormNumeric
  stock?: number | null
  modifierGroupIds: FormNumeric[]
}

export interface Category {
  id: FormNumeric
  name: string
}

export interface SelectedModifier {
  groupId: FormNumeric
  groupName: string
  optionId: FormNumeric
  optionName: string
  priceDelta: FormNumeric
}

export interface CartLineItem {
  id: number
  name: string
  price: FormNumeric
  count: number
  discount: number
  addList: string | string[]
  addListPrice: number
  totalPrice: number
  freeDiscount: boolean
  quickDiscountId: string | null
  quickDiscountName: string
  productId?: string
  selectedModifiers?: Record<string, string[]>
}
