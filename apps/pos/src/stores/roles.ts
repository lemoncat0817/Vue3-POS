import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role } from '@pos/contract'

export const useRolesStore = defineStore(
  'roles',
  () => {
    const roleList = ref<Role[]>([])

    const hydrateRolesFromServer = (list: Role[]) => {
      roleList.value = list
    }

    return { roleList, hydrateRolesFromServer }
  },
  {
    persist: true
  }
)
