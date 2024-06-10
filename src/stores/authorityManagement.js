import { ref } from 'vue'
import { defineStore } from 'pinia'



export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  // 當前的查看的資料類型
  const currentAuthorityManagementPage = ref(0)
  // 人員名單
  const staffList = ref([{
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
    authorityCheckList: ['canFreeDrink', 'canCheckOrder', 'canEditOrderStatus', 'canCheckBackgroundSetting'],
    canFreeDrink: 'O',
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
