import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateOrderRequest } from '@pos/contract'
import { offlineDb } from './db'
import {
  countPending,
  enqueueOrder,
  listDueOrders,
  markFailed,
  markSynced,
  markSyncing
} from './outbox'

const samplePayload: CreateOrderRequest = {
  idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
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
      oftenUseDiscount3: false
    }
  ],
  bagCount: 0,
  payment: '現金',
  orderDiscount: 0,
  discountName: '無'
}

beforeEach(async () => {
  await offlineDb.outboxOrders.clear()
})

describe('enqueueOrder / listDueOrders', () => {
  it('enqueue 後可以被 listDueOrders 取出，以 idempotencyKey 當主鍵', async () => {
    await enqueueOrder(samplePayload, 'local-1')
    const due = await listDueOrders()
    expect(due).toHaveLength(1)
    expect(due[0]).toMatchObject({
      id: samplePayload.idempotencyKey,
      localOrderId: 'local-1',
      status: 'pending'
    })
  })

  it('nextAttemptAt 還沒到的項目不會被 listDueOrders 取出（指數退避期間跳過）', async () => {
    await enqueueOrder(samplePayload, 'local-1')
    const future = Date.now() + 10_000
    await markFailed(samplePayload.idempotencyKey, '模擬失敗', future)

    expect(await listDueOrders(Date.now())).toHaveLength(0)
    expect(await listDueOrders(future + 1)).toHaveLength(1)
  })

  it('依 createdAt 順序回傳（保留送單先後順序）', async () => {
    await enqueueOrder(
      { ...samplePayload, idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA1' },
      'local-1'
    )
    await enqueueOrder(
      { ...samplePayload, idempotencyKey: '01ARZ3NDEKTSV4RRFFQ69G5FA2' },
      'local-2'
    )
    const due = await listDueOrders()
    expect(due.map((o) => o.localOrderId)).toEqual(['local-1', 'local-2'])
  })
})

describe('markSynced', () => {
  it('同步成功後從佇列移除，countPending 歸零', async () => {
    await enqueueOrder(samplePayload, 'local-1')
    await markSyncing(samplePayload.idempotencyKey)
    await markSynced(samplePayload.idempotencyKey)
    expect(await countPending()).toBe(0)
  })
})

describe('markFailed', () => {
  it('累加 attempts 並記錄錯誤訊息', async () => {
    await enqueueOrder(samplePayload, 'local-1')
    await markFailed(samplePayload.idempotencyKey, '網路逾時', Date.now())
    const row = await offlineDb.outboxOrders.get(samplePayload.idempotencyKey)
    expect(row).toMatchObject({ attempts: 1, status: 'failed', lastError: '網路逾時' })
  })
})
