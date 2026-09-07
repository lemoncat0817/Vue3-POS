import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateOrderRequest, Order } from '@pos/contract'
import { ApiError } from '@/api/http'
import { offlineDb } from './db'
import { enqueueOrder } from './outbox'
import { syncOnce, syncStatus } from './sync-worker'

vi.mock('@/api/orders', () => ({
  createOrder: vi.fn(),
}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { createOrder } = (await import('@/api/orders')) as any

const payload = (idempotencyKey: string): CreateOrderRequest => ({
  idempotencyKey,
  businessDate: '20240610',
  staff: '店長 - Lemon',
  lines: [
    {
      name: '楊枝甘露2.0',
      price: 80,
      size: 'L',
      count: 1,
      addList: '無添加配料',
      addListPrice: 0,
      freeDiscount: false,
      ecoDiscount: false,
      bottleDiscount: false,
      oftenUseDiscount1: false,
      oftenUseDiscount2: false,
      oftenUseDiscount3: false,
    },
  ],
  bagCount: 0,
  payment: '現金',
  orderDiscount: 0,
  discountName: '無',
})

function fakeOrder(orderId: string): Order {
  return {
    orderId,
    orderTime: '2024-06-10T12:00:00.000Z',
    orderStatus: '已完成',
    staff: '店長 - Lemon',
    orderData: [],
    orderBagCount: 0,
    orderCupCount: 1,
    orderTotalPrice: 80,
    orderPayment: '現金',
    orderDiscount: 0,
    orderPaymentPrice: 80,
    discountName: '無',
  }
}

beforeEach(async () => {
  await offlineDb.outboxOrders.clear()
  createOrder.mockReset()
  syncStatus.lastError = null
})

describe('syncOnce', () => {
  it('同步成功：呼叫 onSynced 並把這筆從佇列移除', async () => {
    await enqueueOrder(payload('01ARZ3NDEKTSV4RRFFQ69G5FA1'), 'local-1')
    createOrder.mockResolvedValueOnce(fakeOrder('202406101'))

    const onSynced = vi.fn()
    await syncOnce(onSynced)

    expect(onSynced).toHaveBeenCalledWith('local-1', expect.objectContaining({ orderId: '202406101' }))
    expect(await offlineDb.outboxOrders.count()).toBe(0)
    expect(syncStatus.pendingCount).toBe(0)
  })

  it('同步失敗：這筆留在佇列裡（狀態變 failed），排到後面的重試時間，不會呼叫 onSynced', async () => {
    await enqueueOrder(payload('01ARZ3NDEKTSV4RRFFQ69G5FA2'), 'local-2')
    createOrder.mockRejectedValueOnce(new ApiError('POST /api/orders 失敗：HTTP 503', 503))

    const onSynced = vi.fn()
    await syncOnce(onSynced)

    expect(onSynced).not.toHaveBeenCalled()
    const row = await offlineDb.outboxOrders.get('01ARZ3NDEKTSV4RRFFQ69G5FA2')
    expect(row).toMatchObject({ status: 'failed', attempts: 1 })
    expect(row!.nextAttemptAt).toBeGreaterThan(Date.now())
    expect(syncStatus.lastError).toContain('503')
  })

  it('第一筆失敗時，不繼續嘗試佇列裡後面的項目（保留送單順序，避免序號錯位）', async () => {
    await enqueueOrder(payload('01ARZ3NDEKTSV4RRFFQ69G5FA3'), 'local-3')
    await enqueueOrder(payload('01ARZ3NDEKTSV4RRFFQ69G5FA4'), 'local-4')
    createOrder.mockRejectedValueOnce(new ApiError('連線逾時', 0))

    await syncOnce(vi.fn())

    expect(createOrder).toHaveBeenCalledTimes(1)
    expect(await offlineDb.outboxOrders.count()).toBe(2)
  })

  it('navigator.onLine 為 false 時完全不嘗試（避免明知會失敗還讓 attempts 白白增加）', async () => {
    await enqueueOrder(payload('01ARZ3NDEKTSV4RRFFQ69G5FA5'), 'local-5')
    const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    await syncOnce(vi.fn())

    expect(createOrder).not.toHaveBeenCalled()
    const row = await offlineDb.outboxOrders.get('01ARZ3NDEKTSV4RRFFQ69G5FA5')
    expect(row).toMatchObject({ status: 'pending', attempts: 0 })
    // 跳過嘗試不代表跳過狀態更新：離線時新入列的項目一樣要反映在
    // pendingCount 上，同步狀態列（見 layout/header/index.vue）才顯示
    // 得出「有東西還沒送出去」。
    expect(syncStatus.pendingCount).toBe(1)

    onLineSpy.mockRestore()
  })
})
