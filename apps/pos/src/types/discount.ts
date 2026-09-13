import type { FormNumeric } from './common'

export interface OrderCoupon {
  id: FormNumeric
  name: string
  kind: 'amount' | 'percent'
  value: FormNumeric
}

export interface QuickDiscount {
  id: FormNumeric
  name: string
  kind: 'amount' | 'percent'
  value: FormNumeric
}
