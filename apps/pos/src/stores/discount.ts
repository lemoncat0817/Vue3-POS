import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FormNumeric, MoneyDiscount, OftenUseDiscountList, PercentDiscount } from '@/types'

export const useDiscountStore = defineStore('discount', () => {
  // 促銷資料來源：初次啟動時自伺服端注入，後續以本機（含管理員異動）為準。
  const promotionSource = ref<'seed' | 'server'>('seed')

  const discountMenu = ref(0)
  const moneySelectingDiscountId = ref<FormNumeric>(0)
  const moneyDiscountId = ref<FormNumeric>(0)
  const currentDiscountName = ref('')
  const currentMoneyDiscount = ref<FormNumeric>(0)
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
  const percentSelectingDiscountId = ref<FormNumeric>(0)
  const percentDiscountId = ref<FormNumeric>(0)
  const currentPercentDiscount = ref<FormNumeric>(0)
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

  // 僅在尚未同步過伺服端資料時套用，避免覆蓋本機編輯。
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
