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
