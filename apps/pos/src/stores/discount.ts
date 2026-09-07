import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FormNumeric, MoneyDiscount, OftenUseDiscountList, PercentDiscount } from '@/types'

export const useDiscountStore = defineStore('discount', () => {
  // P5：促銷資料（現金／折數折價券、常用折扣）改由 apps/api 當唯一
  // 來源（見 src/api/promotions.ts）。下面保留的種子資料是「第一次
  // 啟動、還沒同步過、且伺服端也連不到」時的離線預設值，不是常態資料
  // 來源。promotionSource 的用法跟 stores/drink.ts 的 catalogSource
  // 完全一樣：只在第一次（本機從未同步過伺服端促銷資料）時套用，之後
  // 永遠以本機資料為準，避免背景同步蓋掉畫面上還沒送出的編輯狀態。
  const promotionSource = ref<'seed' | 'server'>('seed')

  // 當前折價券選單
  const discountMenu = ref(0)
  // 當前正在選的現金折價券id
  const moneySelectingDiscountId = ref<FormNumeric>(0)
  // 當前已選的現金折價券id
  const moneyDiscountId = ref<FormNumeric>(0)
  // 當前已選的折價券名稱
  const currentDiscountName = ref('')
  // 當前已選的現金折價券折價金額
  const currentMoneyDiscount = ref<FormNumeric>(0)
  // 定義現金折價券的資料
  const moneyDiscount = ref<MoneyDiscount[]>([{
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
  const percentSelectingDiscountId = ref<FormNumeric>(0)
  // 當前已選的折數折價券id
  const percentDiscountId = ref<FormNumeric>(0)
  // 當前已選的現金折價券折價金額
  const currentPercentDiscount = ref<FormNumeric>(0)
  // 定義折數折價券的資料
  const percentDiscount = ref<PercentDiscount[]>([{
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
  const oftenUseDiscount = ref<OftenUseDiscountList>([{
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

  // 見上方 promotionSource 的說明：只在第一次（本機從未同步過伺服端
  // 促銷資料）時套用。
  const hydratePromotionsFromServer = (promotions: {
    moneyDiscount: MoneyDiscount[]
    percentDiscount: PercentDiscount[]
    oftenUseDiscount: OftenUseDiscountList
  }) => {
    if (promotionSource.value === 'server') return
    moneyDiscount.value = promotions.moneyDiscount
    percentDiscount.value = promotions.percentDiscount
    oftenUseDiscount.value = promotions.oftenUseDiscount
    promotionSource.value = 'server'
  }

  return {
    promotionSource,
    hydratePromotionsFromServer,
    discountMenu, moneyDiscount, moneyDiscountId, percentDiscountId, percentDiscount, currentMoneyDiscount, moneySelectingDiscountId, percentSelectingDiscountId, currentPercentDiscount, currentDiscountName, oftenUseDiscount,
  }
}, {
  persist: true,
})
