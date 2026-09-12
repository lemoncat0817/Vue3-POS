import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { operatorLoginRequestSchema } from '@pos/contract'
import {
  ApiError,
  apiErrorMessage,
  fetchJson,
  setDeviceToken,
  setDeviceTokenInvalidHandler,
  setOperatorSessionInvalidHandler
} from './http'

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setOperatorSessionInvalidHandler(null)
    setDeviceTokenInvalidHandler(null)
    setDeviceToken(null)
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

  it('裝置憑證錯誤的 401 觸發裝置憑證失效回呼，不會觸發操作員登出回呼（兩者無關）', async () => {
    // 這次請求真的帶了憑證卻被拒絕，才算「憑證失效」——見 fetchJson 裡
    // deviceTokenSentThisRequest 的說明，沒帶憑證的 401 不該觸發撤銷。
    setDeviceToken('some-device-token')
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
    const operatorHandler = vi.fn()
    const deviceHandler = vi.fn()
    setOperatorSessionInvalidHandler(operatorHandler)
    setDeviceTokenInvalidHandler(deviceHandler)
    await expect(fetchJson('/api/members')).rejects.toThrow()
    expect(operatorHandler).not.toHaveBeenCalled()
    expect(deviceHandler).toHaveBeenCalledOnce()
  })

  it('裝置憑證錯誤的 401 但這次請求根本沒帶憑證時，不觸發裝置憑證失效回呼（避免 hydrate 競態把合法憑證洗掉）', async () => {
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
    const deviceHandler = vi.fn()
    setDeviceTokenInvalidHandler(deviceHandler)
    await expect(fetchJson('/api/members')).rejects.toThrow()
    expect(deviceHandler).not.toHaveBeenCalled()
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

describe('apiErrorMessage', () => {
  it('ApiError 顯示伺服端回傳的訊息', () => {
    expect(apiErrorMessage(new ApiError('帳號已存在', 409))).toBe('操作失敗：帳號已存在')
  })

  it('本地端 zod（apps/pos 用的 v3）驗證失敗要顯示資料格式錯誤，不能誤判成斷線', () => {
    let err: unknown
    try {
      z.string().min(1).parse('')
    } catch (e) {
      err = e
    }
    expect(apiErrorMessage(err)).toBe('資料格式有誤，請確認欄位內容後再試一次')
  })

  // @pos/contract 用的是 zod v4，跟 apps/pos 自己的 zod v3 是不同模組實例；
  // apiErrorMessage() 得認得出兩邊丟出來的 ZodError，見 isZodError() 的說明。
  it('@pos/contract（zod v4）丟出的 ZodError 一樣要能辨識出來，不能誤判成斷線', () => {
    let err: unknown
    try {
      operatorLoginRequestSchema.parse({ account: 'emily', pin: '' })
    } catch (e) {
      err = e
    }
    expect(apiErrorMessage(err)).toBe('資料格式有誤，請確認欄位內容後再試一次')
  })

  it('其餘未知錯誤（例如真的斷線）才顯示連不上伺服端', () => {
    expect(apiErrorMessage(new TypeError('Failed to fetch'))).toBe('連不上伺服端，請確認網路連線')
  })
})
