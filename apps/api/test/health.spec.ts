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

describe('CORS（P3：apps/pos 與這個 API 跑在不同 origin；P21：規劃書 §10 P21「API 安全加固」改成白名單）', () => {
  it('白名單內的來源，OPTIONS 預檢請求允許帶 X-Device-Token 標頭的跨源呼叫', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog', {
      method: 'OPTIONS',
      headers: {
        // createTestApp 的 allowedOrigins 固定是這個（見
        // test/helpers/app.ts），對應本機 e2e 測試用的 vite preview。
        Origin: 'http://localhost:4173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Device-Token',
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4173')
    expect(res.headers.get('access-control-allow-headers')).toContain('X-Device-Token')
  })

  it('白名單外的來源，不會拿到 Access-Control-Allow-Origin（P21 修復：不再是 origin: \'*\'）', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/catalog', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Device-Token',
      },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
