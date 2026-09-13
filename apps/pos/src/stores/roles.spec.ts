import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRolesStore } from './roles'
import type { Role } from '@pos/contract'

describe('useRolesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始角色清單為空陣列', () => {
    const store = useRolesStore()
    expect(store.roleList).toEqual([])
  })

  it('hydrateRolesFromServer() 覆蓋角色清單', () => {
    const store = useRolesStore()
    const mockRoles: Role[] = [
      {
        id: 'role-admin',
        name: '店長',
        authorityCheckList: ['canCheckout', 'canRefund', 'canVoidOrder']
      }
    ]

    store.hydrateRolesFromServer(mockRoles)
    expect(store.roleList).toEqual(mockRoles)
  })
})
