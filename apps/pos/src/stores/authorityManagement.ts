import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StaffMember } from '@/types'

/**
 * P4：登入（views/login/index.vue）已經改成真的向伺服端驗證帳號＋PIN
 * （見 api/auth.ts），不再讀這份名單做密碼比對——下面每筆資料的
 * `password` 欄位因此純粹是歷史遺留的靜態展示資料，不對應任何真實
 * 帳密，不會被拿去跟使用者輸入比對。這個頁面（backgroundSetting/
 * permissionManagement）本身還是純本機狀態，新增／編輯在這裡做的
 * 人員異動不會同步到伺服端的 staff 表，也不影響誰能實際登入——這是
 * 跟 P3 對 productManagement 菜單 CRUD 一樣的已知限制，見那邊
 * catalogSource 的說明；等權限管理也接上伺服端寫入 API 才會統一。
 */
export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  // 當前的查看的資料類型
  const currentAuthorityManagementPage = ref(0)
  // 人員名單
  const staffList = ref<StaffMember[]>([{
    id: 1,
    name: 'Lemon',
    jobTitle: '店長',
    account: 'lemon',
    password: 'lemon123',
    authorityCheckList: ['canFreeDrink', 'canOpenCashier', 'canCheckOrder', 'canEditOrderStatus', 'canDeleteOrder',
      'canCheckBackgroundSetting', 'canSetDrinkType', 'canSetDrink', 'canSetIngredients', 'canSetMoneyDiscount', 'canSetPercentDiscount',
      'canSetOftenUseDiscount', 'canCheckDataAnalysis', 'canCheckAuthority', 'canSetAuthority', 'canSetPayMethod'],
    canFreeDrink: 'O',
    canOpenCashier: 'O',
    canCheckOrder: 'O',
    canEditOrderStatus: 'O',
    canDeleteOrder: 'O',
    canCheckBackgroundSetting: 'O',
    canSetDrinkType: 'O',
    canSetDrink: 'O',
    canSetIngredients: 'O',
    canSetMoneyDiscount: 'O',
    canSetPercentDiscount: 'O',
    canSetOftenUseDiscount: 'O',
    canCheckDataAnalysis: 'O',
    canCheckAuthority: 'O',
    canSetAuthority: 'O',
    canSetPayMethod: 'O',
  }, {
    id: 2,
    name: 'James',
    jobTitle: '值班經理',
    account: 'james',
    password: 'james123',
    authorityCheckList: ['canFreeDrink', 'canOpenCashier', 'canCheckOrder', 'canEditOrderStatus',
      'canCheckBackgroundSetting', 'canSetDrinkType', 'canSetDrink', 'canSetIngredients', 'canCheckDataAnalysis'],
    canFreeDrink: 'O',
    canOpenCashier: 'O',
    canCheckOrder: 'O',
    canEditOrderStatus: 'O',
    canDeleteOrder: 'X',
    canCheckBackgroundSetting: 'O',
    canSetDrinkType: 'O',
    canSetDrink: 'O',
    canSetIngredients: 'O',
    canSetMoneyDiscount: 'X',
    canSetPercentDiscount: 'X',
    canSetOftenUseDiscount: 'X',
    canCheckDataAnalysis: 'O',
    canCheckAuthority: 'X',
    canSetAuthority: 'X',
    canSetPayMethod: 'X',
  },
  {
    id: 3,
    name: 'Emily',
    jobTitle: '工讀生',
    account: 'emily',
    password: 'emily123',
    authorityCheckList: ['canCheckOrder', 'canEditOrderStatus', 'canCheckBackgroundSetting'],
    canFreeDrink: 'X',
    canOpenCashier: 'X',
    canCheckOrder: 'O',
    canEditOrderStatus: 'O',
    canDeleteOrder: 'X',
    canCheckBackgroundSetting: 'O',
    canSetDrinkType: 'X',
    canSetDrink: 'X',
    canSetIngredients: 'X',
    canSetMoneyDiscount: 'X',
    canSetPercentDiscount: 'X',
    canSetOftenUseDiscount: 'X',
    canCheckDataAnalysis: 'X',
    canCheckAuthority: 'X',
    canSetAuthority: 'X',
    canSetPayMethod: 'X',
  }])

  return { currentAuthorityManagementPage, staffList }
}, {
  persist: true,
})
