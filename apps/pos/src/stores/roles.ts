import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role } from '@pos/contract'

/**
 * 權限群組（角色）store。
 * 啟動時一次性同步伺服端資料，後續以本機操作為準；roleSource 與 roleList 須一同持久化以避免競態與重整遺失。
 */
export const useRolesStore = defineStore('roles', () => {
  const roleSource = ref<'seed' | 'server'>('seed')
  const roleList = ref<Role[]>([])

  // 僅在尚未同步過伺服端資料時套用，避免覆蓋本機編輯。
  const hydrateRolesFromServer = (list: Role[]) => {
    if (roleSource.value === 'server') return
    roleList.value = list
    roleSource.value = 'server'
  }

  return { roleSource, roleList, hydrateRolesFromServer }
}, {
  persist: true,
})
