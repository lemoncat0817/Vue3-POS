import { describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/app'
import { createTestDb } from './helpers/db'

describe('GET /health', () => {
  it('回傳服務正常', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe('CORS（P3：apps/pos 與這個 API 跑在不同 origin）', () => {
  it('OPTIONS 預檢請求允許帶 X-Device-Token 標頭的跨源呼叫', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Device-Token',
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(res.headers.get('access-control-allow-headers')).toContain('X-Device-Token')
  })
})
