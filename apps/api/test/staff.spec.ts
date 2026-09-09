import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'

const staffBaseFields = { name: 'Emily', jobTitle: '工讀生', account: 'emily' }

describe('GET /api/staff', () => {
  it('不需要裝置憑證就能讀取員工名單', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { id: 'role-owner-test', name: '店長', capabilities: [] })
    await db.insert(staff).values({
      id: 's1',
      name: 'Lemon',
      jobTitle: '店長',
      account: 'lemon',
      roleId,
      pinHash: 'irrelevant-for-this-test',
      pinSalt: 'irrelevant-for-this-test',
    })

    const app = createTestApp(db)
    const res = await app.request('/api/staff')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      { id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', roleId, roleName: '店長', capabilities: [] },
    ])
  })
})

describe('POST /api/staff（權限拒絕案例）', () => {
  it('沒有帶裝置憑證標頭時拒絕，回傳 401', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: ['canCheckOrder', 'canEditOrderStatus'] })
    const app = createTestApp(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
    })
    expect(res.status).toBe(401)
  })

  it('裝置憑證錯誤時拒絕，回傳 401', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: ['canCheckOrder', 'canEditOrderStatus'] })
    const app = createTestApp(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': 'wrong-token' },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
    })
    expect(res.status).toBe(401)
  })

  it('指定不存在的權限群組時拒絕，回傳 404', async () => {
    const db = createTestDb()
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId: 'does-not-exist', pin: '3456' }),
    })
    expect(res.status).toBe(404)
  })

  it('裝置憑證正確時允許建立員工', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '工讀生', capabilities: ['canCheckOrder', 'canEditOrderStatus'] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
    })
    expect(res.status).toBe(201)

    const list = (await (await app.request('/api/staff')).json()) as unknown[]
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(
      expect.objectContaining({ ...staffBaseFields, roleId, roleName: '工讀生', capabilities: ['canCheckOrder', 'canEditOrderStatus'] }),
    )
    expect(list[0]).not.toHaveProperty('pin')
    expect(list[0]).not.toHaveProperty('pinHash')
  })

  it('裝置憑證被撤銷後就不再能通過檢查', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
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
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
    })
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/staff/:id', () => {
  it('沒有帶裝置憑證時拒絕，回傳 401', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const app = createTestApp(db)
    const res = await app.request('/api/staff/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...staffBaseFields, roleId }),
    })
    expect(res.status).toBe(401)
  })

  it('更新職稱與角色，不填 PIN 時沿用既有的雜湊值', async () => {
    const db = createTestDb()
    const partTimerRoleId = await seedRole(db, { name: '工讀生', capabilities: ['canCheckOrder', 'canEditOrderStatus'] })
    const dutyManagerRoleId = await seedRole(db, { name: '值班經理', capabilities: ['canCheckOrder'] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const created = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId: partTimerRoleId, pin: '3456' }),
      })
    ).json() as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, jobTitle: '值班經理', roleId: dutyManagerRoleId }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(expect.objectContaining({ jobTitle: '值班經理', roleId: dutyManagerRoleId, roleName: '值班經理', capabilities: ['canCheckOrder'] }))

    // 原本的 PIN（3456）應該還能登入——沒填 pin 時不該把雜湊值清掉或改掉。
    const login = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: 'emily', pin: '3456' }),
    })
    expect(login.status).toBe(200)
  })

  it('指定不存在的權限群組時拒絕，回傳 404', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const created = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
      })
    ).json() as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId: 'does-not-exist' }),
    })
    expect(res.status).toBe(404)
  })

  it('帳號被其他員工使用時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    await app.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId, account: 'lemon', pin: '3456' }),
    })
    const second = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId, account: 'james', pin: '3456' }),
      })
    ).json() as { id: string }

    const res = await app.request(`/api/staff/${second.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId, account: 'lemon' }),
    })
    expect(res.status).toBe(409)
  })

  it('找不到員工時回傳 404', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId }),
    })
    expect(res.status).toBe(404)
  })

  it('此變更會讓沒有人擁有設定人員名單的權限時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const adminRoleId = await seedRole(db, { name: '店長', capabilities: ['canSetAuthority'] })
    const partTimerRoleId = await seedRole(db, { name: '工讀生', capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const created = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId: adminRoleId, pin: '3456' }),
      })
    ).json() as { id: string }

    // 這是全店唯一一位擁有 canSetAuthority 的員工，改成無此權限的角色應該被擋下。
    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId: partTimerRoleId }),
    })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/staff/:id（P18）', () => {
  it('沒有帶裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/staff/does-not-exist', { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('刪除存在的員工，之後 GET 也看不到', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const created = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' }),
      })
    ).json() as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(204)

    const list = await (await app.request('/api/staff')).json()
    expect(list).toEqual([])
  })

  it('找不到員工時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/staff/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })

  it('刪除最後一位擁有設定人員名單權限的員工時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const adminRoleId = await seedRole(db, { name: '店長', capabilities: ['canSetAuthority'] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const created = await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
        body: JSON.stringify({ ...staffBaseFields, roleId: adminRoleId, pin: '3456' }),
      })
    ).json() as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(409)
  })
})
