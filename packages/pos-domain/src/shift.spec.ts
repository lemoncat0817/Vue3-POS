import { describe, expect, it } from 'vitest'
import { summarizeShiftCash } from './shift'

describe('summarizeShiftCash', () => {
  it('沒有任何現金異動時，應有現金等於開帳零用金，帳差為 0（點鈔剛好對得起來）', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 0, cashIn: 0, cashOut: 0, cashRefunds: 0, actualCash: 3000 })
    expect(result).toEqual({ expectedCash: 3000, variance: 0 })
  })

  it('現金營業額計入應有現金', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 5000, cashIn: 0, cashOut: 0, cashRefunds: 0, actualCash: 8000 })
    expect(result).toEqual({ expectedCash: 8000, variance: 0 })
  })

  it('中途存入增加應有現金，中途提出減少應有現金', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 5000, cashIn: 1000, cashOut: 2000, cashRefunds: 0, actualCash: 7000 })
    expect(result).toEqual({ expectedCash: 7000, variance: 0 })
  })

  it('退款金額從應有現金扣除（P12：退款一律視為現金退出抽屜）', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 5000, cashIn: 0, cashOut: 0, cashRefunds: 800, actualCash: 7200 })
    expect(result).toEqual({ expectedCash: 7200, variance: 0 })
  })

  it('實際點鈔少於應有現金時，帳差為負數（短少）', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 5000, cashIn: 0, cashOut: 0, cashRefunds: 0, actualCash: 7900 })
    expect(result).toEqual({ expectedCash: 8000, variance: -100 })
  })

  it('實際點鈔多於應有現金時，帳差為正數（多出）', () => {
    const result = summarizeShiftCash({ openingFloat: 3000, cashSales: 5000, cashIn: 0, cashOut: 0, cashRefunds: 0, actualCash: 8050 })
    expect(result).toEqual({ expectedCash: 8000, variance: 50 })
  })
})
