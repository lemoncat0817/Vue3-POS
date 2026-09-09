import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrderStore } from './order'

// 驗證訂單編號計算（同一營業日遞增、跨日歸零）。
describe('useOrderStore — 訂單編號', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('同一營業日內連續送單，編號依序遞增', () => {
    vi.setSystemTime(new Date(2024, 5, 10, 12, 0, 0))
    const orderStore = useOrderStore()

    expect(orderStore.nextOrderId).toBe('202406101')
    expect(orderStore.issueOrderId()).toBe('202406101')
    expect(orderStore.nextOrderId).toBe('202406102')
    expect(orderStore.issueOrderId()).toBe('202406102')
  })

  it('凌晨 04:00 前的訂單歸屬前一個營業日，不會提前歸零編號', () => {
    vi.setSystemTime(new Date(2024, 5, 10, 23, 0, 0))
    const orderStore = useOrderStore()
    orderStore.issueOrderId() // 202406101

    // 跨過午夜，但還沒到營業日切換時間（04:00）——理應仍是 6/10 營業日。
    vi.setSystemTime(new Date(2024, 5, 11, 2, 0, 0))
    expect(orderStore.nextOrderId).toBe('202406102')
    expect(orderStore.issueOrderId()).toBe('202406102')
  })

  it('過了營業日切換時間後，編號歸零並換成新的營業日前綴', () => {
    vi.setSystemTime(new Date(2024, 5, 10, 12, 0, 0))
    const orderStore = useOrderStore()
    orderStore.issueOrderId() // 202406101
    orderStore.issueOrderId() // 202406102

    vi.setSystemTime(new Date(2024, 5, 11, 4, 0, 0))
    expect(orderStore.nextOrderId).toBe('202406111')
    expect(orderStore.issueOrderId()).toBe('202406111')
    expect(orderStore.issueOrderId()).toBe('202406112')
  })
})
