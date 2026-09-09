import type { FormNumeric } from './common'

/**
 * 訂單折價券（例如「$50折價券」「整單95折」），整張訂單套用一張，
 * 後台可自由新增/刪除任意筆數。跟 QuickDiscount 同形狀是刻意的——
 * 原本現金／折數兩種折價券各自獨立一張表，其實是同一個概念（依 kind
 * 決定套用金額或折數），因此統一成一種。
 */
export interface OrderCoupon {
  id: FormNumeric
  name: string
  kind: 'amount' | 'percent'
  value: FormNumeric
}

/** 快速折扣（常客優惠、員工優惠……），後台可自由新增/刪除任意筆數。 */
export interface QuickDiscount {
  id: FormNumeric
  name: string
  kind: 'amount' | 'percent'
  value: FormNumeric
}
