import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { createTestApp, createTestAppWithDevice } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'

describe('GET /api/roles', () => {
  it('不需要裝置憑證就能讀取權限群組清單', async () => {
    const db = createTestDb()
    await seedRole(db, { id: 'role-1', name: '值班經理', capabilities: ['canCheckOrder'], isSystem: true })
    const app = createTestApp(db)
    const res = await app.request('/api/roles')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'role-1', name: '值班經理', capabilities: ['canCheckOrder'], isSystem: true }])
  })
})

describe('POST /api/roles', () => {
  it('沒有帶裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '外場', capabilities: ['canCheckOrder'] }),
    })
    expect(res.status).toBe(401)
  })

  it('裝置憑證正確時允許建立，且預設不是系統內建角色', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '外場', capabilities: ['canCheckOrder'] }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ name: '外場', capabilities: ['canCheckOrder'], isSystem: false })
  })

  it('名稱重複時拒絕，回傳 409', async () => {
    const db = createTestDb()
    await seedRole(db, { name: '外場', capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '外場', capabilities: [] }),
    })
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/roles/:id', () => {
  it('可以調整系統內建角色的權限內容', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '店長', capabilities: ['canCheckOrder'], isSystem: true })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '店長', capabilities: ['canCheckOrder', 'canDeleteOrder'] }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ capabilities: ['canCheckOrder', 'canDeleteOrder'], isSystem: true })
  })

  it('系統內建角色不可改名，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '店長', capabilities: [], isSystem: true })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '總經理', capabilities: [] }),
    })
    expect(res.status).toBe(409)
  })

  it('找不到角色時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/roles/does-not-exist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '外場', capabilities: [] }),
    })
    expect(res.status).toBe(404)
  })

  it('此變更會讓沒有人擁有設定人員名單的權限時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '店長', capabilities: ['canSetAuthority'], isSystem: true })
    await db.insert(staff).values({
      id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', roleId,
      pinHash: 'x', pinSalt: 'x',
    })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '店長', capabilities: [] }),
    })
    expect(res.status).toBe(409)
  })

  it('系統中本來就沒有人擁有此權限時，不受最後管理者防護限制', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '工讀生', capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ name: '工讀生', capabilities: ['canCheckOrder'] }),
    })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/roles/:id', () => {
  it('系統內建角色不可刪除，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '店長', capabilities: [], isSystem: true })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(409)
  })

  it('仍有員工使用此角色時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '外場', capabilities: [] })
    await db.insert(staff).values({
      id: 's1', name: 'Emily', jobTitle: '外場', account: 'emily', roleId,
      pinHash: 'x', pinSalt: 'x',
    })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(409)
  })

  it('沒有員工使用的自訂角色可以刪除', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { name: '外場', capabilities: [] })
    const { app, deviceToken } = await createTestAppWithDevice(db)
    const res = await app.request(`/api/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(204)
  })

  it('找不到角色時回傳 404', async () => {
    const { app, deviceToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/roles/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken },
    })
    expect(res.status).toBe(404)
  })
})
