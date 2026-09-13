import { describe, expect, it, vi } from 'vitest'
import * as httpModule from './http'
import {
  addCashMovement,
  closeShift,
  fetchCurrentShift,
  openShift
} from './shifts'
import type { Shift } from '@pos/contract'

describe('shifts api client', () => {
  const dummyShift: Shift = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    status: 'open',
    openedBy: '店長',
    openedAt: '2025-05-01T08:00:00Z',
    openingFloat: 3000,
    closedBy: null,
    closedAt: null,
    cashSales: null,
    cashIn: 0,
    cashOut: 0,
    refunds: null,
    expectedCash: null,
    actualCash: null,
    variance: null,
    movements: []
  }

  it('fetchCurrentShift() 當班別存在時回傳 Shift 物件', async () => {
    vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(dummyShift)
    const shift = await fetchCurrentShift()
    expect(shift).toEqual(dummyShift)
  })

  it('fetchCurrentShift() 當伺服端回傳 404 ApiError 時回傳 null', async () => {
    vi.spyOn(httpModule, 'fetchJson').mockRejectedValue(new httpModule.ApiError('No open shift', 404))
    const shift = await fetchCurrentShift()
    expect(shift).toBeNull()
  })

  it('fetchCurrentShift() 遇到非 404 錯誤時正常拋出', async () => {
    vi.spyOn(httpModule, 'fetchJson').mockRejectedValue(new Error('Network error'))
    await expect(fetchCurrentShift()).rejects.toThrow('Network error')
  })

  it('openShift(), addCashMovement(), closeShift() 正常調用 API', async () => {
    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(dummyShift)

    await openShift({
      shiftId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      operator: '店長',
      openingFloat: 3000
    })
    expect(spy).toHaveBeenCalledWith('/api/shifts', expect.objectContaining({ method: 'POST' }))

    await addCashMovement('01ARZ3NDEKTSV4RRFFQ69G5FAV', {
      type: 'in',
      amount: 500,
      reason: '找零準備',
      operator: '店長'
    })
    expect(spy).toHaveBeenCalledWith(
      '/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/cash-movements',
      expect.objectContaining({ method: 'POST' })
    )

    await closeShift('01ARZ3NDEKTSV4RRFFQ69G5FAV', { operator: '店長', actualCash: 3500 })
    expect(spy).toHaveBeenCalledWith(
      '/api/shifts/01ARZ3NDEKTSV4RRFFQ69G5FAV/close',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
