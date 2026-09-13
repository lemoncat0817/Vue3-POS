import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useAuthorityManagementStore } from './authorityManagement'
import type { StaffMember } from '@/types'

function staff(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 's1',
    name: 'Lemon',
    jobTitle: '店長',
    account: 'lemon',
    roleId: 'role-owner',
    roleName: '店長',
    authorityCheckList: ['canCheckOrder'],
    ...overrides
  }
}

describe('useAuthorityManagementStore — hydrateStaffFromServer()', () => {
  it('第一次呼叫時，用伺服端資料取代種子資料', () => {
    setActivePinia(createPinia())
    const store = useAuthorityManagementStore()

    store.hydrateStaffFromServer([staff()])

    expect(store.staffList).toEqual([staff()])
  })

  it('再次呼叫會用最新的伺服端資料整份覆蓋，包含本機在這之間做的異動', () => {
    setActivePinia(createPinia())
    const store = useAuthorityManagementStore()

    store.hydrateStaffFromServer([staff()])
    store.staffList.push(staff({ id: 's2', name: '管理員新增的人員', account: 'new-hire' }))

    store.hydrateStaffFromServer([staff({ roleName: '伺服端又改了角色名字' })])

    expect(store.staffList).toEqual([staff({ roleName: '伺服端又改了角色名字' })])
  })
})
