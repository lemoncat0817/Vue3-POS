import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson, setOperatorSessionInvalidHandler } from './http'

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setOperatorSessionInvalidHandler(null)
  })

  it('204 No Content 不呼叫 res.json()（空 body 解析會丟例外），直接回傳 undefined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          json: () => Promise.reject(new Error('不該被呼叫：204 沒有 body'))
        } as unknown as Response)
      )
    )
    await expect(
      fetchJson('/api/promotions/money-coupons/money-1', { method: 'DELETE' })
    ).resolves.toBeUndefined()
  })

  it('非 2xx 回應丟出 ApiError，帶正確的狀態碼', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)
      )
    )
    await expect(fetchJson('/api/orders', { method: 'POST' })).rejects.toMatchObject(
      new ApiError('POST /api/orders 失敗：HTTP 401', 401)
    )
  })

  it('非 2xx 回應的 body 帶 error 欄位時，ApiError 訊息採用伺服端的原話', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: '此變更會讓沒有人擁有權限管理能力' })
        } as Response)
      )
    )
    await expect(fetchJson('/api/roles/role-1', { method: 'PUT' })).rejects.toMatchObject(
      new ApiError('此變更會讓沒有人擁有權限管理能力', 409)
    )
  })

  it('操作員 session 缺漏或過期的 401 會觸發全域強制登出回呼', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: '缺少操作員 session（X-Operator-Session）' })
        } as Response)
      )
    )
    const handler = vi.fn()
    setOperatorSessionInvalidHandler(handler)
    await expect(fetchJson('/api/members', { method: 'POST' })).rejects.toThrow()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('裝置憑證錯誤的 401 不會觸發強制登出回呼（跟操作員 session 無關）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: '裝置憑證無效或缺漏' })
        } as Response)
      )
    )
    const handler = vi.fn()
    setOperatorSessionInvalidHandler(handler)
    await expect(fetchJson('/api/members')).rejects.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  it('正常回應照樣解析 JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true })
        } as Response)
      )
    )
    await expect(fetchJson('/health')).resolves.toEqual({ ok: true })
  })
})
