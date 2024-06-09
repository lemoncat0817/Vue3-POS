import { ref } from 'vue'
import { defineStore } from 'pinia'



export const useAuthorityManagementStore = defineStore('authorityManagement', () => {
  // 當前的查看的資料類型
  const currentAuthorityManagementPage = ref(0)
  // 人員名單
  const StaffList = ref([{
    id: 1,
    name: 'Lemon',
    jobTitle: '店長',
    account: 'lemon',
    password: 'lemon123',
    authorityCheckList: ['canOrder', 'canOpenCashier', 'canCheckOrder', 'canEditProduct', 'canEditDiscount', 'canCheckDataAnalysis', 'canEditAuthority'],
    canOrder: 'O',
    canOpenCashier: 'O',
    canCheckOrder: 'O',
    canEditProduct: 'O',
    canEditDiscount: 'O',
    canCheckDataAnalysis: 'O',
    canEditAuthority: 'O',
  },
  {
    id: 2,
    name: 'Emily',
    jobTitle: '工讀生',
    account: 'emily',
    password: 'emily123',
    authorityCheckList: ['canOrder', 'canOpenCashier', 'canCheckOrder'],
    canOrder: 'O',
    canOpenCashier: 'O',
    canCheckOrder: 'O',
    canEditProduct: 'X',
    canEditDiscount: 'X',
    canCheckDataAnalysis: 'X',
    canEditAuthority: 'X',
  }])

  return { currentAuthorityManagementPage, StaffList }
}, {
  persist: true,
})
