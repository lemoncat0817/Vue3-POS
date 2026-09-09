import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * 人員名單 store。
 * 啟動時一次性同步伺服端資料，後續以本機操作為準；staffSource 與 staffList 須一同持久化以避免競態與重整遺失。
 */
export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  const staffSource = ref<'seed' | 'server'>('seed')
  const staffList = ref<StaffMember[]>([])

  // 僅在尚未同步過伺服端資料時套用，避免覆蓋本機編輯。
  const hydrateStaffFromServer = (list: StaffMember[]) => {
    if (staffSource.value === 'server') return
    staffList.value = list
    staffSource.value = 'server'
  }

  return { staffSource, hydrateStaffFromServer, staffList }
}, {
  persist: true,
})
