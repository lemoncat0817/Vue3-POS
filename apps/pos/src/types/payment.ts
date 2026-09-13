import type { FormNumeric } from './common'

export type PaymentUseMethod = '紙鈔' | '感應' | '掃描'

export interface PaymentMethod {
  id: FormNumeric
  name: string
  disabled: boolean
  useMethod: PaymentUseMethod
}
