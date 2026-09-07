import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'

const expectedStaffFields = {
  name: 'Emily',
  jobTitle: '工讀生',
  account: 'emily',
  capabilities: ['canCheckOrder', 'canEditOrderStatus'],
}
// 回應（staffSchema）不含 pin，請求則多這一欄——分開兩個常數，不用
// 解構丟棄的方式避免宣告未使用變數。
const newStaffInput = { ...expectedStaffFields, pin: '3456' }

describe('GET /api/staff', () => {
  it('不需要裝置憑證就能讀取員工名單', async () => {
    const db = createTestDb()
    await db.insert(staff).values({
      id: 's1',
      name: 'Lemon',
      jobTitle: '店長',
      account: 'lemon',
      capabilities: [],
      pinHash: 'irrelevant-for-this-test',
      pinSalt: 'irrelevant-for-this-test',
    })

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
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(newStaffInput),
    })
    expect(res.status).toBe(201)

    const list = (await (await app.request('/api/staff')).json()) as unknown[]
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(expect.objectContaining(expectedStaffFields))
    expect(list[0]).not.toHaveProperty('pin')
    expect(list[0]).not.toHaveProperty('pinHash')
  })

  it('裝置憑證被撤銷後就不再能通過檢查', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)

    const list = (await (
      await app.request('/api/devices', { headers: { 'X-Device-Token': deviceToken } })
    ).json()) as Array<{ id: string }>
    await app.request(`/api/devices/${list[0]!.id}/revoke`, {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken },
    })

    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify(newStaffInput),
    })
    expect(res.status).toBe(401)
  })
})
