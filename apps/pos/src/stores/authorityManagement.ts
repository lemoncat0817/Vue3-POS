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
  // 頁面分頁狀態（人員管理／權限群組），比照 stores/setting.ts 的 currentSettingPage。
  const currentTab = ref<'staff' | 'roles'>('staff')

  // 權限改為角色制那次改動幫 StaffMember 加了 roleId／roleName 欄位；瀏覽器裡舊版留下的
  // 持久化資料沒有這兩個欄位，若只看 staffSource 會被誤判為「已同步過」而永遠不再更新，
  // 畫面上就會看到權限群組欄位空白、使用人數統計不到人。這裡額外檢查資料形狀是否過時，
  // 過時就無視 staffSource 強制重新同步一次，讓舊瀏覽器自己修好，不必要求使用者手動清快取。
  const hasStaleShape = () => staffList.value.some((item) => !item.roleId)

  // 僅在尚未同步過伺服端資料時套用，避免覆蓋本機編輯。
  const hydrateStaffFromServer = (list: StaffMember[]) => {
    if (staffSource.value === 'server' && !hasStaleShape()) return
    staffList.value = list
    staffSource.value = 'server'
  }

  return { staffSource, hydrateStaffFromServer, staffList, currentTab }
}, {
  persist: true,
})
