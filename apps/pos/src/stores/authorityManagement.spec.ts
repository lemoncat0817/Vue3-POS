import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useAuthorityManagementStore } from './authorityManagement'
import type { StaffMember } from '@/types'

function staff(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', password: '',
    roleId: 'role-owner', roleName: '店長', authorityCheckList: ['canCheckOrder'],
    ...overrides,
  }
}

/** 驗證 hydrateStaffFromServer() 僅初次注入伺服端資料，避免覆蓋本機編輯。 */
describe('useAuthorityManagementStore — hydrateStaffFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const store = useAuthorityManagementStore()

    expect(store.staffSource).toBe('seed')
    store.hydrateStaffFromServer([staff()])

    expect(store.staffSource).toBe('server')
    expect(store.staffList).toEqual([staff()])
  })

  it('已經同步過一次、資料形狀正常時，再呼叫不會覆蓋本機（可能已被管理員編輯過）的資料', () => {
    setActivePinia(createPinia())
    const store = useAuthorityManagementStore()

    store.hydrateStaffFromServer([staff()])
    store.staffList.push(staff({ id: 's2', name: '管理員新增的人員', account: 'new-hire' }))

    store.hydrateStaffFromServer([staff({ roleName: '伺服端又改了角色名字' })])

    expect(store.staffList).toHaveLength(2)
    expect(store.staffList[1]).toMatchObject({ name: '管理員新增的人員' })
  })

  // 權限改為角色制那次改動幫 StaffMember 加了 roleId／roleName；瀏覽器裡舊版留下的
  // 持久化資料沒有這兩個欄位，不能只看 staffSource==='server' 就跳過同步，否則畫面
  // 會一直卡著權限群組空白、使用人數算不到人，且永遠不會自己修好。
  it('持久化資料是舊版缺少 roleId 的形狀時，即使 staffSource 已是 server 也強制重新同步', () => {
    setActivePinia(createPinia())
    const store = useAuthorityManagementStore()

    // 模擬瀏覽器裡殘留的舊版持久化資料：staffSource 已是 'server'，但物件缺少 roleId。
    store.staffSource = 'server'
    store.staffList = [{ id: 's1', name: 'Lemon', jobTitle: '店長', account: 'lemon', password: '', authorityCheckList: [] } as unknown as StaffMember]

    store.hydrateStaffFromServer([staff()])

    expect(store.staffList).toEqual([staff()])
  })
})
