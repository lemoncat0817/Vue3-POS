import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson } from './http'

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('204 No Content 不呼叫 res.json()（空 body 解析會丟例外），直接回傳 undefined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          json: () => Promise.reject(new Error('不該被呼叫：204 沒有 body')),
        } as unknown as Response),
      ),
    )
    await expect(fetchJson('/api/promotions/money-coupons/money-1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('非 2xx 回應丟出 ApiError，帶正確的狀態碼', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)),
    )
    await expect(fetchJson('/api/orders', { method: 'POST' })).rejects.toMatchObject(
      new ApiError('POST /api/orders 失敗：HTTP 401', 401),
    )
  })

  it('正常回應照樣解析 JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) } as Response)),
    )
    await expect(fetchJson('/health')).resolves.toEqual({ ok: true })
  })
})
