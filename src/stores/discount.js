import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useDiscountStore = defineStore('discount', () => {
  // 當前折價券選單
  const discountMenu = ref(0)
  // 當前已選的現金折價券id
  const moneyDiscountId = ref(0)
  // 定義現金折價券的資料
  const moneyDiscount = ref([{
    "id": 1,
    "name": "$50折價券",
    "discountMoney": 50,
  },
  {
    "id": 2,
    "name": "$100折價券",
    "discountMoney": 100,
  },
  {
    "id": 3,
    "name": "$150折價券",
    "discountMoney": 150,
  },
  {
    "id": 4,
    "name": "$200折價券",
    "discountMoney": 200,
  }])
  // 當前已選的折數折價券id
  const percentDiscountId = ref(0)
  // 定義折數折價券的資料
  const percentDiscount = ref([{
    "id": 1,
    "name": "整單95折",
    "discountMoney": 0.95,
  },
  {
    "id": 2,
    "name": "整單75折",
    "discountMoney": 0.75,
  },
  {
    "id": 3,
    "name": "整單7折",
    "discountMoney": 0.7,
  },
  {
    "id": 4,
    "name": "整單5折",
    "discountMoney": 0.5,
  }])

  return { discountMenu, moneyDiscount, moneyDiscountId, percentDiscountId, percentDiscount }
}, {
  persist: true,
})
