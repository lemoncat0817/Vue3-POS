import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { offlineDb, type ParkedOrder } from './db'
import { addParkedOrder, deleteParkedOrder, listParkedOrders } from './parked-orders'

describe('parked-orders offline storage', () => {
  const sampleParked: ParkedOrder = {
    id: '01JABCD1234567890123456789',
    createdAt: 1000,
    note: '內用 5 號桌',
    lines: [],
    bagCount: 0,
    orderChannel: '內用',
    invoiceCarrier: { type: '無載具' },
    orderCouponId: 0,
    currentDiscountName: ''
  }

  beforeEach(async () => {
    await offlineDb.parkedOrders.clear()
  })

  it('addParkedOrder() 新增掛單並可透過 listParkedOrders() 依時間排序取得', async () => {
    const order1 = { ...sampleParked, id: 'order-1', createdAt: 200 }
    const order2 = { ...sampleParked, id: 'order-2', createdAt: 100 }

    await addParkedOrder(order1)
    await addParkedOrder(order2)

    const list = await listParkedOrders()
    expect(list).toHaveLength(2)
    expect(list[0]?.id).toBe('order-2')
    expect(list[1]?.id).toBe('order-1')
  })

  it('deleteParkedOrder() 刪除指定掛單', async () => {
    await addParkedOrder(sampleParked)
    expect(await listParkedOrders()).toHaveLength(1)

    await deleteParkedOrder(sampleParked.id)
    expect(await listParkedOrders()).toHaveLength(0)
  })
})
