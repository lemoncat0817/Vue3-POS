import { describe, expect, it, vi } from 'vitest'
import * as httpModule from './http'
import {
  createTable,
  deleteTable,
  fetchTables,
  updateTable,
  updateTableStatus
} from './tables'

describe('tables api client', () => {
  const dummyTable = {
    id: 'tbl-1',
    tableNumber: 'A1',
    seats: 4,
    status: 'empty' as const,
    note: '',
    guestCount: null,
    occupiedAt: null,
    reservationPhone: null,
    reservationTime: null
  }

  it('fetchTables() 取得桌位列表並解析為 DiningTable 陣列', async () => {
    vi.spyOn(httpModule, 'fetchJson').mockResolvedValue([dummyTable])
    const result = await fetchTables()

    expect(result).toHaveLength(1)
    expect(result[0]?.tableNumber).toBe('A1')
  })

  it('createTable() 與 updateTable() 正確發送請求', async () => {
    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(dummyTable)

    await createTable({ tableNumber: 'A1', seats: 4 })
    expect(spy).toHaveBeenCalledWith('/api/tables', expect.objectContaining({ method: 'POST' }))

    await updateTable('tbl-1', { tableNumber: 'A1-改', seats: 6 })
    expect(spy).toHaveBeenCalledWith('/api/tables/tbl-1', expect.objectContaining({ method: 'PUT' }))
  })

  it('updateTableStatus() 發送 PATCH 狀態更新請求', async () => {
    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue({
      ...dummyTable,
      status: 'occupied',
      guestCount: 2
    })

    const updated = await updateTableStatus('tbl-1', { status: 'occupied', guestCount: 2 })
    expect(spy).toHaveBeenCalledWith(
      '/api/tables/tbl-1/status',
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(updated.status).toBe('occupied')
  })

  it('deleteTable() 發送 DELETE 請求', async () => {
    const spy = vi.spyOn(httpModule, 'fetchJson').mockResolvedValue(null)
    await deleteTable('tbl-1')
    expect(spy).toHaveBeenCalledWith('/api/tables/tbl-1', expect.objectContaining({ method: 'DELETE' }))
  })
})
