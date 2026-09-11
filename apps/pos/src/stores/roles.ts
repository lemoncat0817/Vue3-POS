import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role } from '@pos/contract'

/**
 * 權限群組（角色）store。
 * 開機每次拿到伺服端資料都整份覆蓋，本機資料只在離線／連不上時當 fallback
 * ——D1 才是可信賴的持久層，不需要靠「只信任本機」防止被蓋掉。
 */
export const useRolesStore = defineStore('roles', () => {
  const roleList = ref<Role[]>([])

  const hydrateRolesFromServer = (list: Role[]) => {
    roleList.value = list
  }

  return { roleList, hydrateRolesFromServer }
}, {
  persist: true,
})
