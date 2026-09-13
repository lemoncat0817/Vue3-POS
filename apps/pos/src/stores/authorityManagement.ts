import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

export const useAuthorityManagementStore = defineStore(
  'authorityManagement',
  () => {
    const staffList = ref<StaffMember[]>([])
    const currentTab = ref<'staff' | 'roles'>('staff')

    const hydrateStaffFromServer = (list: StaffMember[]) => {
      staffList.value = list
    }

    return { hydrateStaffFromServer, staffList, currentTab }
  },
  {
    persist: true
  }
)
