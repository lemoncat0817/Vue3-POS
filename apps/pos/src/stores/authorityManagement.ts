import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * 人員名單 store。
 * 開機每次拿到伺服端資料都整份覆蓋，本機資料只在離線／連不上時當 fallback
 * ——D1 才是可信賴的持久層，不需要靠「只信任本機」防止被蓋掉（也因此不用
 * 再處理舊版持久化資料缺欄位的情形：反正每次開機都會被最新的伺服端資料蓋掉）。
 */
export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  const staffList = ref<StaffMember[]>([])
  // 頁面分頁狀態（人員管理／權限群組），比照 stores/setting.ts 的 currentSettingPage。
  const currentTab = ref<'staff' | 'roles'>('staff')

  const hydrateStaffFromServer = (list: StaffMember[]) => {
    staffList.value = list
  }

  return { hydrateStaffFromServer, staffList, currentTab }
}, {
  persist: true,
})
