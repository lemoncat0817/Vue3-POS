import type { FormNumeric } from './common'

/** 支付方式的操作方法：付款時顧客／店員實際採取的動作。 */
export type PaymentUseMethod = '紙鈔' | '感應' | '掃描'

/** 一種付款方式（現金、信用卡、LinePay…）。 */
export interface PaymentMethod {
  id: FormNumeric
  name: string
  disabled: boolean
  useMethod: PaymentUseMethod
}
