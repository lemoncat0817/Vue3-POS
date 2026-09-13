export interface ShiftCashSummaryInput {
  openingFloat: number
  cashSales: number
  cashIn: number
  cashOut: number
  cashRefunds: number
  actualCash: number
}

export interface ShiftCashSummary {
  expectedCash: number
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
