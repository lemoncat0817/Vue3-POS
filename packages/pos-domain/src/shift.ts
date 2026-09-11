/** 班別結算純函式。依開帳零用金、現金營收、現金出入庫、退款與實際點鈔計算應有現金與帳差。 */

export interface ShiftCashSummaryInput {
  /** 開帳零用金。 */
  openingFloat: number
  /** 現金支付收到的金額總和。 */
  cashSales: number
  /** 中途存入現金抽屜的總額。 */
  cashIn: number
  /** 中途從抽屜提出的總額。 */
  cashOut: number
  /** 退還顧客的金額總和。退款均視為由現金抽屜支出，故直接計入現金結算公式。 */
  cashRefunds: number
  /** 收班時依面額實際點鈔算出的金額。 */
  actualCash: number
}

export interface ShiftCashSummary {
  /** 帳面上應該有的現金：開帳零用金 + 現金營業額 + 存入 − 提出 − 退款。 */
  expectedCash: number
  /** 帳差：實際點鈔 − 應有現金。正數是多出來，負數是短少。 */
  variance: number
}

export function summarizeShiftCash(input: ShiftCashSummaryInput): ShiftCashSummary {
  const expectedCash =
    input.openingFloat + input.cashSales + input.cashIn - input.cashOut - input.cashRefunds
  return {
    expectedCash,
    variance: input.actualCash - expectedCash
  }
}
