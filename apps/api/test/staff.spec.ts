import { describe, expect, it } from 'vitest'
import { staff } from '../src/db/schema'
import { issueWebSession } from '../src/auth/web-session'
import { createTestApp, createTestAppWithDevice, issueTestSession } from './helpers/app'
import { createTestDb } from './helpers/db'
import { seedRole } from './helpers/roles'

const staffBaseFields = { name: 'Emily', jobTitle: '工讀生', account: 'emily' }

describe('GET /api/staff', () => {
  it('沒有裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/staff')
    expect(res.status).toBe(401)
  })

  it('帶裝置憑證即可讀取員工名單', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { id: 'role-owner-test', name: '店長', capabilities: [] })
    await db.insert(staff).values({
      id: 's1',
      name: 'Lemon',
      jobTitle: '店長',
      account: 'lemon',
      roleId,
      pinHash: 'irrelevant-for-this-test',
      pinSalt: 'irrelevant-for-this-test'
    })

    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const res = await app.request('/api/staff', {
      headers: { 'X-Device-Token': deviceToken }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      {
        id: 's1',
        name: 'Lemon',
        jobTitle: '店長',
        account: 'lemon',
        roleId,
        roleName: '店長',
        capabilities: []
      }
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
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
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
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
    })
    expect(res.status).toBe(401)
  })

  it('指定不存在的權限群組時拒絕，回傳 404', async () => {
    const db = createTestDb()
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId: 'does-not-exist', pin: '3456' })
    })
    expect(res.status).toBe(404)
  })

  it('裝置憑證正確時允許建立員工', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, {
      name: '工讀生',
      capabilities: ['canCheckOrder', 'canEditOrderStatus']
    })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
    })
    expect(res.status).toBe(201)

    // list 還包含 createTestAppWithDevice() 附掛的測試操作員，只挑剛建立的這筆出來斷言。
    const list = (await (
      await app.request('/api/staff', { headers: { 'X-Device-Token': deviceToken } })
    ).json()) as Record<string, unknown>[]
    const createdStaff = list.find((row) => row.account === staffBaseFields.account)
    expect(createdStaff).toEqual(
      expect.objectContaining({
        ...staffBaseFields,
        roleId,
        roleName: '工讀生',
        capabilities: ['canCheckOrder', 'canEditOrderStatus']
      })
    )
    expect(createdStaff).not.toHaveProperty('pin')
    expect(createdStaff).not.toHaveProperty('pinHash')
  })

  it('裝置憑證被撤銷後就不再能通過檢查', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)

    const list = (await (
      await app.request('/api/devices', {
        headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
      })
    ).json()) as Array<{ id: string }>
    await app.request(`/api/devices/${list[0]!.id}/revoke`, {
      method: 'POST',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })

    const res = await app.request('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
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
      body: JSON.stringify({ ...staffBaseFields, roleId })
    })
    expect(res.status).toBe(401)
  })

  it('更新職稱與角色，不填 PIN 時沿用既有的雜湊值', async () => {
    const db = createTestDb()
    const partTimerRoleId = await seedRole(db, {
      name: '工讀生',
      capabilities: ['canCheckOrder', 'canEditOrderStatus']
    })
    const dutyManagerRoleId = await seedRole(db, {
      name: '值班經理',
      capabilities: ['canCheckOrder']
    })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const created = (await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ ...staffBaseFields, roleId: partTimerRoleId, pin: '3456' })
      })
    ).json()) as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, jobTitle: '值班經理', roleId: dutyManagerRoleId })
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(
      expect.objectContaining({
        jobTitle: '值班經理',
        roleId: dutyManagerRoleId,
        roleName: '值班經理',
        capabilities: ['canCheckOrder']
      })
    )

    // 原本的 PIN（3456）應該還能登入——沒填 pin 時不該把雜湊值清掉或改掉。
    const login = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ account: 'emily', pin: '3456' })
    })
    expect(login.status).toBe(200)
  })

  it('可以編輯自己的姓名／帳號／PIN，只要角色群組不變', async () => {
    const db = createTestDb()
    const { app, deviceToken, staffId, sessionToken } = await createTestAppWithDevice(db)
    const self = (await (
      await app.request(`/api/staff`, { headers: { 'X-Device-Token': deviceToken } })
    ).json()) as { id: string; roleId: string }[]
    const ownRoleId = self.find((row) => row.id === staffId)?.roleId
    expect(ownRoleId).toBeDefined()

    const res = await app.request(`/api/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({
        name: '改過的名字',
        jobTitle: '改過的職稱',
        account: 'renamed-self',
        roleId: ownRoleId,
        pin: '9999'
      })
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(
      expect.objectContaining({ name: '改過的名字', jobTitle: '改過的職稱', account: 'renamed-self' })
    )
  })

  it('指定不存在的權限群組時拒絕，回傳 404', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const created = (await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
      })
    ).json()) as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId: 'does-not-exist' })
    })
    expect(res.status).toBe(404)
  })

  it('帳號被其他員工使用時拒絕，回傳 409', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    await app.request('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, account: 'lemon', pin: '3456' })
    })
    const second = (await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ ...staffBaseFields, roleId, account: 'james', pin: '3456' })
      })
    ).json()) as { id: string }

    const res = await app.request(`/api/staff/${second.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, account: 'lemon' })
    })
    expect(res.status).toBe(409)
  })

  it('找不到員工時回傳 404', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const res = await app.request('/api/staff/does-not-exist', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': sessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId })
    })
    expect(res.status).toBe(404)
  })

  it('變更自己的權限群組時拒絕，回傳 403', async () => {
    const db = createTestDb()
    const adminRoleId = await seedRole(db, {
      name: '店長',
      capabilities: ['canManageStaff', 'canManageRoles']
    })
    const partTimerRoleId = await seedRole(db, { name: '工讀生', capabilities: [] })
    const adminStaffId = 'admin-1'
    await db.insert(staff).values({
      id: adminStaffId,
      name: 'Lemon',
      jobTitle: '店長',
      account: 'lemon',
      roleId: adminRoleId,
      pinHash: 'x',
      pinSalt: 'x'
    })
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const adminSessionToken = await issueTestSession(db, adminStaffId)

    // 操作者正在改自己的角色群組，不管改完之後全店還有沒有人擁有 canManageRoles 都要擋下。
    const res = await app.request(`/api/staff/${adminStaffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': adminSessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId: partTimerRoleId })
    })
    expect(res.status).toBe(403)
  })

  it('變更他人的角色群組後會讓沒有人擁有設定權限群組的權限時拒絕，回傳 409', async () => {
    const db = createTestDb()
    // 操作者只需要 canManageStaff 就能呼叫這支 API，本身不必是權限管理者。
    // 用 seedStaff: false 跳過自動附掛的全權限操作員——否則店裡永遠還有別人
    // 擁有 canManageRoles，「歸零」這個條件永遠不會成立（見 helpers/app.ts）。
    const managerRoleId = await seedRole(db, {
      name: '主管',
      capabilities: ['canManageStaff']
    })
    const roleAdminRoleId = await seedRole(db, { name: '店長', capabilities: ['canManageRoles'] })
    const partTimerRoleId = await seedRole(db, { name: '工讀生', capabilities: [] })
    const managerStaffId = 'manager-1'
    const roleAdminStaffId = 'admin-1'
    await db.insert(staff).values([
      {
        id: managerStaffId,
        name: 'Manager',
        jobTitle: '主管',
        account: 'manager',
        roleId: managerRoleId,
        pinHash: 'x',
        pinSalt: 'x'
      },
      {
        id: roleAdminStaffId,
        name: 'Lemon',
        jobTitle: '店長',
        account: 'lemon',
        roleId: roleAdminRoleId,
        pinHash: 'x',
        pinSalt: 'x'
      }
    ])
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const managerSessionToken = await issueTestSession(db, managerStaffId)

    // roleAdminStaffId 是全店唯一一位擁有 canManageRoles 的員工，被別人改成無此權限的角色應該被擋下。
    const res = await app.request(`/api/staff/${roleAdminStaffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Operator-Session': managerSessionToken
      },
      body: JSON.stringify({ name: 'Lemon', jobTitle: '店長', account: 'lemon', roleId: partTimerRoleId })
    })
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/staff/:id（忘記 PIN 救援：X-Web-Session）', () => {
  it('沒有 X-Operator-Session，但帶著同一租戶有效的 X-Web-Session 也能重設 PIN', async () => {
    const db = createTestDb()
    const tenantId = 'tenant-owner'
    // tenantId 就是 users.id（見 db/schema.ts 的說明），staff／roles 的
    // tenantId 外鍵指到這裡——要先讓 createTestAppWithDevice() 建好 users 列，
    // 才能接著插入同租戶的角色／員工，不然會撞 FOREIGN KEY constraint。
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false,
      tenantId
    })
    const roleId = await seedRole(db, { capabilities: [], tenantId })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId,
      ...staffBaseFields,
      roleId,
      pinHash: 'old-hash',
      pinSalt: 'old-salt'
    })
    const webSessionToken = await issueWebSession(db, tenantId)

    const res = await app.request(`/api/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Web-Session': webSessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '9999' })
    })
    expect(res.status).toBe(200)

    // 新 PIN 應該真的生效了。
    const login = await app.request('/api/auth/operator-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ account: staffBaseFields.account, pin: '9999' })
    })
    expect(login.status).toBe(200)
  })

  it('X-Web-Session 屬於別的租戶時拒絕，回傳 401', async () => {
    const db = createTestDb()
    const tenantId = 'tenant-owner'
    const otherTenantId = 'tenant-intruder'
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false,
      tenantId
    })
    const roleId = await seedRole(db, { capabilities: [], tenantId })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId,
      ...staffBaseFields,
      roleId,
      pinHash: 'old-hash',
      pinSalt: 'old-salt'
    })
    // 另一個租戶自己的 web session，不該對這個租戶的裝置有任何效力。
    await createTestAppWithDevice(db, 'other-device', { seedStaff: false, tenantId: otherTenantId })
    const foreignWebSessionToken = await issueWebSession(db, otherTenantId)

    const res = await app.request(`/api/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': deviceToken,
        'X-Web-Session': foreignWebSessionToken
      },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '9999' })
    })
    expect(res.status).toBe(401)
  })

  it('缺少 X-Operator-Session 又沒有 X-Web-Session 時，一樣拒絕，回傳 401', async () => {
    const db = createTestDb()
    const tenantId = 'tenant-owner'
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false,
      tenantId
    })
    const roleId = await seedRole(db, { capabilities: [], tenantId })
    const staffId = crypto.randomUUID()
    await db.insert(staff).values({
      id: staffId,
      tenantId,
      ...staffBaseFields,
      roleId,
      pinHash: 'old-hash',
      pinSalt: 'old-salt'
    })

    const res = await app.request(`/api/staff/${staffId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
      body: JSON.stringify({ ...staffBaseFields, roleId, pin: '9999' })
    })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/staff/:id', () => {
  it('沒有帶裝置憑證時拒絕，回傳 401', async () => {
    const app = createTestApp(createTestDb())
    const res = await app.request('/api/staff/does-not-exist', { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('刪除存在的員工，之後 GET 也看不到', async () => {
    const db = createTestDb()
    const roleId = await seedRole(db, { capabilities: [] })
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(db)
    const created = (await (
      await app.request('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
          'X-Operator-Session': sessionToken
        },
        body: JSON.stringify({ ...staffBaseFields, roleId, pin: '3456' })
      })
    ).json()) as { id: string }

    const res = await app.request(`/api/staff/${created.id}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(204)

    // list 還包含 createTestAppWithDevice() 附掛的測試操作員，只確認剛刪除的這筆不見了。
    const list = (await (
      await app.request('/api/staff', { headers: { 'X-Device-Token': deviceToken } })
    ).json()) as Record<string, unknown>[]
    expect(list.find((row) => row.account === staffBaseFields.account)).toBeUndefined()
  })

  it('找不到員工時回傳 404', async () => {
    const { app, deviceToken, sessionToken } = await createTestAppWithDevice(createTestDb())
    const res = await app.request('/api/staff/does-not-exist', {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': sessionToken }
    })
    expect(res.status).toBe(404)
  })

  it('刪除自己時拒絕，回傳 403', async () => {
    const db = createTestDb()
    const adminRoleId = await seedRole(db, {
      name: '店長',
      capabilities: ['canManageStaff', 'canManageRoles']
    })
    const adminStaffId = 'admin-1'
    await db.insert(staff).values({
      id: adminStaffId,
      name: 'Lemon',
      jobTitle: '店長',
      account: 'lemon',
      roleId: adminRoleId,
      pinHash: 'x',
      pinSalt: 'x'
    })
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const adminSessionToken = await issueTestSession(db, adminStaffId)

    const res = await app.request(`/api/staff/${adminStaffId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': adminSessionToken }
    })
    expect(res.status).toBe(403)
  })

  it('刪除他人後會讓沒有人擁有設定權限群組的權限時拒絕，回傳 409', async () => {
    const db = createTestDb()
    // 操作者只需要 canManageStaff 就能呼叫這支 API，本身不必是權限管理者。
    // 用 seedStaff: false 避免自動附掛的操作員讓「歸零」條件永遠不成立。
    const managerRoleId = await seedRole(db, {
      name: '主管',
      capabilities: ['canManageStaff']
    })
    const roleAdminRoleId = await seedRole(db, { name: '店長', capabilities: ['canManageRoles'] })
    const managerStaffId = 'manager-1'
    const roleAdminStaffId = 'admin-1'
    await db.insert(staff).values([
      {
        id: managerStaffId,
        name: 'Manager',
        jobTitle: '主管',
        account: 'manager',
        roleId: managerRoleId,
        pinHash: 'x',
        pinSalt: 'x'
      },
      {
        id: roleAdminStaffId,
        name: 'Lemon',
        jobTitle: '店長',
        account: 'lemon',
        roleId: roleAdminRoleId,
        pinHash: 'x',
        pinSalt: 'x'
      }
    ])
    const { app, deviceToken } = await createTestAppWithDevice(db, 'test-device', {
      seedStaff: false
    })
    const managerSessionToken = await issueTestSession(db, managerStaffId)

    // roleAdminStaffId 是全店唯一一位擁有 canManageRoles 的員工，被別人刪除應該被擋下。
    const res = await app.request(`/api/staff/${roleAdminStaffId}`, {
      method: 'DELETE',
      headers: { 'X-Device-Token': deviceToken, 'X-Operator-Session': managerSessionToken }
    })
    expect(res.status).toBe(409)
  })
})
