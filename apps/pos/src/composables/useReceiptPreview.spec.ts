import { describe, expect, it } from 'vitest'
import type { OrderRecord } from '@/types'
import {
  closeReceipt,
  showReceipt,
  useReceiptPreviewState
} from './useReceiptPreview'

describe('useReceiptPreview composable', () => {
  const dummyOrder = {
    orderId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    lines: [],
    finalTotal: 100,
    paid: 100,
    change: 0
  } as unknown as OrderRecord

  it('showReceipt() 開啟預覽對話框並存入訂單資料', () => {
    showReceipt(dummyOrder)
    const state = useReceiptPreviewState()
    expect(state.open).toBe(true)
    expect(state.order).toEqual(dummyOrder)
  })

  it('closeReceipt() 關閉對話框', () => {
    closeReceipt()
    const state = useReceiptPreviewState()
    expect(state.open).toBe(false)
  })
})
