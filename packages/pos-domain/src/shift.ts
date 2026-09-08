/**
 * 班別結算（重構規劃書 §10 P0「班別結帳」）。
 *
 * 純函式，只做一件事：從開帳零用金、現金營業額、中途提現／存入、
 * 現金退款、收班實際點鈔金額，算出「應有現金」與「帳差」。跟計價一樣，
 * 這個計算本身值得單獨測試、不依賴資料庫或 HTTP，實際的班別開關、
 * 現金營業額／退款查詢留給 apps/api/src/routes/shifts.ts。
 */

export interface ShiftCashSummaryInput {
  /** 開帳零用金。 */
  openingFloat: number
  /** 這個班別期間現金支付（tender.method 為現金類）收到的金額總和。 */
  cashSales: number
  /** 中途存入現金抽屜的總額（例如找零準備金追加）。 */
  cashIn: number
  /** 中途從抽屜提出的總額（例如存入保險箱）。 */
  cashOut: number
  /**
   * 這個班別期間退還給顧客的金額總和（P12：規劃書 §10 P0「退款／
   * 作廢」）。不論原本收的是不是現金，退款一律視為從現金抽屜退出去
   * （見 apps/api/src/routes/shifts.ts 的 sumCashRefunds 說明），因此
   * 直接併入現金公式，不是另外開一個「非現金退款」欄位。
   */
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
  const expectedCash = input.openingFloat + input.cashSales + input.cashIn - input.cashOut - input.cashRefunds
  return {
    expectedCash,
    variance: input.actualCash - expectedCash,
  }
}
