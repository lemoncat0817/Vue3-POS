import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { createTestApp, TEST_DEVICE_TOKEN } from './helpers/app'
import { createTestDb } from './helpers/db'

const newStaffInput = {
  name: 'Emily',
  jobTitle: '工讀生',
  account: 'emily',
  capabilities: ['canCheckOrder', 'canEditOrderStatus'],
}

describe('GET /api/staff', () => {
  it('不需要裝置憑證就能讀取員工名單', async () => {
    const db = createTestDb()
    await db.insert(staff).values({ id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', capabilities: [] })

    const app = createTestApp(db)
    const res = await app.request('/api/staff')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', capabilities: [] }])
  })
})

describe('POST /api/staff（權限拒絕案例，見重構規劃書 §14 P2 退出條件）', () => {
  it('沒有帶裝置憑證標頭時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaffInput),
    })
    expect(res.status).toBe(401)
  })

  it('裝置憑證錯誤時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': 'wrong-token' },
      body: JSON.stringify(newStaffInput),
    })
    expect(res.status).toBe(401)
  })

  it('裝置憑證正確時允許建立員工', async () => {
    const db = createTestDb()
    const app = createTestApp(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': TEST_DEVICE_TOKEN },
      body: JSON.stringify(newStaffInput),
    })
    expect(res.status).toBe(201)

    const list = (await (await app.request('/api/staff')).json()) as unknown[]
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject(newStaffInput)
  })
})
