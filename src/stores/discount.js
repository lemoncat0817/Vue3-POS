import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useDiscountStore = defineStore('discount', () => {
  // 當前折價券選單
  const discountMenu = ref(0)
  // 當前正在選的現金折價券id
  const moneySelectingDiscountId = ref(0)
  // 當前已選的現金折價券id
  const moneyDiscountId = ref(0)
  // 當前已選的折價券名稱
  const currentDiscountName = ref('')
  // 當前已選的現金折價券折價金額
  const currentMoneyDiscount = ref(0)
  // 定義現金折價券的資料
  const moneyDiscount = ref([{
    "id": 1,
    "name": "$50折價券",
    "discountMoney": 50,
  },
  {
    "id": 2,
    "name": "滿$300折$100元",
    "discountMoney": 100,
  },
  {
    "id": 3,
    "name": "滿$500折$150元",
    "discountMoney": 150,
  },
  {
    "id": 4,
    "name": "$200折價券",
    "discountMoney": 200,
  }])
  // 當前正在選的折數折價券id
  const percentSelectingDiscountId = ref(0)
  // 當前已選的折數折價券id
  const percentDiscountId = ref(0)
  // 當前已選的現金折價券折價金額
  const currentPercentDiscount = ref(0)
  // 定義折數折價券的資料
  const percentDiscount = ref([{
    "id": 1,
    "name": "整單95折",
    "discountMoney": 0.95,
  },
  {
    "id": 2,
    "name": "週年慶整單88折",
    "discountMoney": 0.88,
  },
  {
    "id": 3,
    "name": "滿千打7折",
    "discountMoney": 0.7,
  },
  {
    "id": 4,
    "name": "滿萬打5折",
    "discountMoney": 0.5,
  }])
  // 常用的折價清單
  const oftenUseDiscount = ref([{
    "id": 1,
    "name": "環保折扣",
    "discountMoney": 5,
    "discountPercent": 1
  },
  {
    "id": 2,
    "name": "瓶裝折扣",
    "discountMoney": 10,
    "discountPercent": 1
  },
  {
    "id": 3,
    "name": "九折",
    "discountMoney": 0,
    "discountPercent": 0.9,
  },
  {
    "id": 4,
    "name": "八五折",
    "discountMoney": 0,
    "discountPercent": 0.85,
  },
  {
    "id": 5,
    "name": "員工八折",
    "discountMoney": 0,
    "discountPercent": 0.8,
  }
  ])

  return { discountMenu, moneyDiscount, moneyDiscountId, percentDiscountId, percentDiscount, currentMoneyDiscount, moneySelectingDiscountId, percentSelectingDiscountId, currentPercentDiscount, currentDiscountName, oftenUseDiscount }
}, {
  persist: true,
})
