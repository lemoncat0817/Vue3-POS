import { ref, watch, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { useDiscountStore } from '@/stores/discount'
import type { CartLineItem, DrinkAddOnOption, DrinkListItem, DrinkSimpleOption, DrinkTypeGroup } from '@/types'
import { fromSelection } from '@/utils/selection'

export const useDrinkStore = defineStore('drink', () => {
  // 必須在 setup 函式內呼叫，確保一定在 Pinia 初始化完成之後才執行。
  const discountStore = useDiscountStore()

  // 這裡的陣列是離線種子資料，正常由 apps/api 當唯一來源（見
  // src/api/catalog.ts）。drinkType／drinkAdd 整包會被 persist:true 存進
  // localStorage，backgroundSetting/productManagement 頁面又直接原地
  // 修改這兩個陣列、還沒有對應的伺服端寫入 API——catalogSource 只在
  // 「這個瀏覽器從未同步過伺服端菜單」時套用一次 hydrateCatalogFromServer()，
  // 之後永遠以本機（可能已被管理員編輯過）的資料為準，避免每次啟動都覆蓋管理員的異動。
  const catalogSource = ref<'seed' | 'server'>('seed')

  const drinkType = ref<DrinkTypeGroup[]>([
    {
      "id": 1,
      "name": "季節限定",
      "type": "drinkSeasonal",
      "drinkList": [{
        "id": 1,
        "name": "楊枝甘露2.0",
        "priceL": 80,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 2,
        "name": "芝芝芒果果粒",
        "priceL": 90,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 3,
        "name": "芒果果粒波波",
        "priceL": 80,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 4,
        "name": "芝芝葡萄果粒",
        "priceL": 85,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 5,
        "name": "葡萄果粒波波",
        "priceL": 85,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 6,
        "name": "芝芝草莓果粒",
        "priceL": 90,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 7,
        "name": "提拉米蘇2.0",
        "priceL": 80,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 8,
        "name": "抹茶提拉米蘇2.0",
        "priceL": 90,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 9,
        "name": "番茄梅蜜",
        "priceL": 70,
        "priceBottle": "none",
        "customized": "none"
      },
      {
        "id": 10,
        "name": "番茄梅蜜波波",
        "priceL": 80,
        "priceBottle": "none",
        "customized": "none"
      }]
    },
    {
      "id": 2,
      "name": "果粒茶系列",
      "type": "drinkFreshFruit",
      "drinkList": [{
        "id": 1,
        "name": "香橙果粒茶",
        "priceL": 70,
        "priceBottle": 100,
        "customized": "cold"
      },
      {
        "id": 2,
        "name": "柳橙果粒茶",
        "priceL": 65,
        "priceBottle": 95,
        "customized": "cold"
      },
      {
        "id": 3,
        "name": "葡萄柚果粒茶",
        "priceL": 60,
        "priceBottle": 90,
        "customized": "cold"
      },
      {
        "id": 4,
        "name": "葡萄柚果粒蜜茶",
        "priceL": 65,
        "priceBottle": 100,
        "customized": "cold"
      },
      {
        "id": 5,
        "name": "奇異果果粒茶",
        "priceL": 60,
        "priceBottle": 100,
        "customized": "cold"
      },
      {
        "id": 6,
        "name": "柳橙芒果果粒茶",
        "priceL": 70,
        "priceBottle": "none",
        "customized": "cold"
      }]
    },
    {
      "id": 3,
      "name": "原味茶",
      "type": "drinkOriginal",
      "drinkList": [{
        "id": 1,
        "name": "高山金萱茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 2,
        "name": "翡翠綠茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 3,
        "name": "錫蘭紅茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 4,
        "name": "文山青茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 5,
        "name": "古早味紅茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 6,
        "name": "蜜桃紅茶",
        "priceL": 40,
        "priceBottle": 55,
        "customized": "both"
      },
      {
        "id": 7,
        "name": "金萱雙Q",
        "priceL": 40,
        "priceBottle": 55,
        "customized": "both"
      },
      {
        "id": 8,
        "name": "金萱三Q",
        "priceL": 45,
        "priceBottle": 60,
        "customized": "both"
      }]
    },
    {
      "id": 4,
      "name": "香醇系列",
      "type": "drinkFreshMilk",
      "drinkList": [{
        "id": 1,
        "name": "紅茶拿鐵",
        "priceL": 60,
        "priceBottle": 90,
        "customized": "both"
      },
      {
        "id": 2,
        "name": "鐵觀音拿鐵",
        "priceL": 60,
        "priceBottle": 90,
        "customized": "both"
      },
      {
        "id": 3,
        "name": "波霸紅茶拿鐵",
        "priceL": 60,
        "priceBottle": 90,
        "customized": "both"
      },
      {
        "id": 4,
        "name": "阿華田拿鐵",
        "priceL": 65,
        "priceBottle": 95,
        "customized": "both"
      },
      {
        "id": 5,
        "name": "玫瑰紅茶拿鐵",
        "priceL": 65,
        "priceBottle": 95,
        "customized": "both"
      },
      {
        "id": 6,
        "name": "布丁紅茶拿鐵",
        "priceL": 75,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 7,
        "name": "抹茶拿鐵",
        "priceL": 75,
        "priceBottle": "none",
        "customized": "both"
      }]
    },
    {
      "id": 5,
      "name": "芝芝系列",
      "type": "drinkCheese",
      "drinkList": [{
        "id": 1,
        "name": "芝芝金萱",
        "priceL": 50,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 2,
        "name": "芝芝金萱雙Q",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 3,
        "name": "芝芝金萱三Q",
        "priceL": 65,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 4,
        "name": "芝芝翡翠綠茶",
        "priceL": 50,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 5,
        "name": "芝芝蜜桃紅茶",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 6,
        "name": "芝芝錫蘭紅茶",
        "priceL": 50,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 7,
        "name": "芝芝錫蘭奶茶",
        "priceL": 65,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 8,
        "name": "芝芝阿華田",
        "priceL": 80,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 9,
        "name": "芝芝可可",
        "priceL": 85,
        "priceBottle": "none",
        "customized": "both"
      }]
    },
    {
      "id": 6,
      "name": "鮮果茶飲",
      "type": "drinkFreshJuice",
      "drinkList": [{
        "id": 1,
        "name": "百香雙Q果",
        "priceL": 55,
        "priceBottle": 75,
        "customized": "cold"
      },
      {
        "id": 2,
        "name": "百香綠茶",
        "priceL": 55,
        "priceBottle": 75,
        "customized": "cold"
      },
      {
        "id": 3,
        "name": "百香多多",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "cold"
      },
      {
        "id": 4,
        "name": "翡翠檸檬",
        "priceL": 60,
        "priceBottle": 90,
        "customized": "cold"
      },
      {
        "id": 5,
        "name": "冰萃檸檬雙Q",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 6,
        "name": "金桔檸檬",
        "priceL": 45,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 7,
        "name": "檸檬綠茶",
        "priceL": 45,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 8,
        "name": "檸檬紅茶",
        "priceL": 45,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 9,
        "name": "蜂蜜檸檬",
        "priceL": 55,
        "priceBottle": "none",
        "customized": "cold"
      },
      {
        "id": 10,
        "name": "檸檬多多",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "cold"
      },
      {
        "id": 11,
        "name": "檸檬梅子",
        "priceL": 50,
        "priceBottle": "none",
        "customized": "both"
      }]
    },
    {
      "id": 7,
      "name": "濃醇系列",
      "type": "drinkMilk",
      "drinkList": [{
        "id": 1,
        "name": "錫蘭奶茶",
        "priceL": 40,
        "priceBottle": 70,
        "customized": "both"
      },
      {
        "id": 2,
        "name": "鐵觀音奶茶",
        "priceL": 45,
        "priceBottle": 70,
        "customized": "both"
      },
      {
        "id": 3,
        "name": "波霸奶茶",
        "priceL": 45,
        "priceBottle": 70,
        "customized": "both"
      },
      {
        "id": 4,
        "name": "仙草凍奶茶",
        "priceL": 45,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 5,
        "name": "玫瑰奶茶",
        "priceL": 55,
        "priceBottle": 80,
        "customized": "both"
      },
      {
        "id": 6,
        "name": "布丁奶茶",
        "priceL": 60,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 7,
        "name": "蜜桃奶茶",
        "priceL": 55,
        "priceBottle": 80,
        "customized": "both"
      },
      {
        "id": 8,
        "name": "阿華田",
        "priceL": 60,
        "priceBottle": 85,
        "customized": "both"
      }]
    },
    {
      "id": 8,
      "name": "獨家特調",
      "type": "drinkSpecial",
      "drinkList": [{
        "id": 1,
        "name": "梅子冰茶",
        "priceL": 30,
        "priceBottle": 45,
        "customized": "both"
      },
      {
        "id": 2,
        "name": "梅子綠茶",
        "priceL": 40,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 3,
        "name": "多多綠茶",
        "priceL": 45,
        "priceBottle": 75,
        "customized": "cold"
      },
      {
        "id": 4,
        "name": "冬瓜茶",
        "priceL": 2,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 5,
        "name": "冬瓜青茶",
        "priceL": 30,
        "priceBottle": "none",
        "customized": "both"
      },
      {
        "id": 6,
        "name": "冬瓜檸檬",
        "priceL": 45,
        "priceBottle": 75,
        "customized": "both"
      }]
    }
  ])

  const drinkIce = ref<DrinkSimpleOption[]>([{
    "id": 1,
    "name": "熱",
  },
  {
    "id": 2,
    "name": "去冰",
  },
  {
    "id": 3,
    "name": "微冰",
  },
  {
    "id": 4,
    "name": "少冰",
  },
  {
    "id": 5,
    "name": "正常冰",
  }])
  const drinkSugar = ref<DrinkSimpleOption[]>([{
    "id": 1,
    "name": "無糖",
  },
  {
    "id": 2,
    "name": "一分",
  },
  {
    "id": 3,
    "name": "三分",
  },
  {
    "id": 4,
    "name": "半糖",
  },
  {
    "id": 5,
    "name": "八分",
  },
  {
    "id": 6,
    "name": "正常",
  }])
  const drinkAdd = ref<DrinkAddOnOption[]>([{
    "id": 1,
    "name": "波霸",
    "price": 10,
  },
  {
    "id": 2,
    "name": "珍珠",
    "price": 10,
  },
  {
    "id": 3,
    "name": "混珠",
    "price": 10,
  },
  {
    "id": 4,
    "name": "雙Q果",
    "price": 10,
  },
  {
    "id": 5,
    "name": "椰果",
    "price": 10,
  },
  {
    "id": 6,
    "name": "波波",
    "price": 10,
  },
  {
    "id": 7,
    "name": "波波條",
    "price": 10,
  },
  {
    "id": 8,
    "name": "仙草凍",
    "price": 10,
  },
  {
    "id": 9,
    "name": "綠茶凍",
    "price": 10,
  },
  {
    "id": 10,
    "name": "養樂多",
    "price": 10,
  },
  {
    "id": 11,
    "name": "三Q",
    "price": 15,
  },
  {
    "id": 12,
    "name": "布丁",
    "price": 15,
  },
  {
    "id": 13,
    "name": "芝芝",
    "price": 20,
  }])
  const drinkSize = ref<DrinkSimpleOption[]>([{
    "id": 1,
    "name": "L杯",
  },
  {
    "id": 2,
    "name": "瓶裝",
  }])

  // 0：糖度/冰塊選單；非 0：加料選單。
  const drinkMenu = ref(0)
  const drinkTypeMenu = ref('')
  const drinkItem = ref<DrinkListItem | []>([])
  const drinkSetSugar = ref('')
  const drinkSetIce = ref('')
  const drinkSetSize = ref('')
  const drinkCount = ref('0')
  const drinkAddList = ref<DrinkAddOnOption[]>([])
  const drinkNotPay = ref<CartLineItem[]>([])
  const drinkCurrentTotal = computed(() => {
    const addListTotal = drinkAddList.value.reduce((acc, cur) => acc + Number(cur.price), 0)
    if (drinkSetSize.value === 'L杯') {
      return Number(fromSelection(drinkItem.value)?.priceL) * Number(drinkCount.value) + addListTotal * Number(drinkCount.value)
    } else {
      return Number(fromSelection(drinkItem.value)?.priceBottle) * Number(drinkCount.value) + addListTotal * Number(drinkCount.value)
    }
  })
  const drinkTotalMoney = computed(() => {
    return (Math.round(drinkNotPay.value.reduce((acc, cur) => acc
      + cur.totalPrice, 0)) + currentBagCount.value)
  })
  const currentDrinkCount = computed(() => {
    return drinkNotPay.value.length > 0 ? drinkNotPay.value.reduce((acc, cur) => acc + cur.count, 0) : 0
  })

  watch(() => drinkTypeMenu.value, () => {
    drinkItem.value = []
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = ''
    drinkAddList.value = []
  })
  watch(() => drinkItem.value, () => {
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = ''
    drinkAddList.value = []
  })
  const initialized = ref(false)
  onMounted(() => {
    initialized.value = true
  })
  // store（狀態層）不直接彈窗，只遞增計數器；UI 提示交給實際顯示畫面的
  // 元件（home/index.vue）自己 watch 這個計數器。initialized 守衛防的是
  // pinia-plugin-persistedstate 還原持久化狀態時，drinkNotPay 被重新賦值
  // 觸發這個 watch，搶在 discountStore 也還原完成前就把它重置成 0。
  const cartClearedNotice = ref(0)
  // 掛單也會清空 drinkNotPay（購物車搬進 Dexie 之後清掉），跟結帳後清空
  // 是同一個 watch 觸發點，但掛單當下已經另外彈過「已掛單」的 toast（見
  // components/checkout/ParkedOrdersPanel.vue），不需要再疊加一次語意
  // 不符的提示——這個旗標只抑制「彈提示」，清空袋子數量／重置優惠券兩件
  // 事仍照做。
  const suppressClearedNotice = ref(false)
  watch(() => drinkNotPay.value, () => {
    if (!initialized.value) return
    if (drinkNotPay.value.length === 0) {
      currentBagCount.value = 0
      discountStore.moneySelectingDiscountId = 0
      discountStore.moneyDiscountId = 0
      discountStore.currentMoneyDiscount = 0
      discountStore.percentDiscountId = 0
      discountStore.currentPercentDiscount = 0
      discountStore.percentSelectingDiscountId = 0
      discountStore.currentDiscountName = ''
      if (!suppressClearedNotice.value) {
        cartClearedNotice.value++
      }
    }
  })

  const currentBagCount = ref(0)
  const drinkPayPrice = computed(() => {
    if (discountStore.moneyDiscountId != 0) {
      if (Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - Number(discountStore.currentMoneyDiscount)) < 0) {
        return 0
      } else {
        return Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - Number(discountStore.currentMoneyDiscount))
      }
    } else if (discountStore.percentDiscountId != 0) {
      return Math.round((Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value) * Number(discountStore.currentPercentDiscount))
    } else {
      return Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value)
    }
  })
  const useDiscountPrice = computed(() => {
    return Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - drinkPayPrice.value
  })

  // 見上方 catalogSource 的說明：只在第一次套用，之後不會再覆蓋本機資料。
  const hydrateCatalogFromServer = (catalog: { groups: DrinkTypeGroup[]; addOns: DrinkAddOnOption[] }) => {
    if (catalogSource.value === 'server') return
    drinkType.value = catalog.groups
    drinkAdd.value = catalog.addOns
    catalogSource.value = 'server'
  }

  return {
    catalogSource,
    hydrateCatalogFromServer,
    drinkType,
    drinkIce,
    drinkSugar,
    drinkMenu,
    drinkAdd,
    drinkTypeMenu,
    drinkItem,
    drinkSetSugar,
    drinkSetIce,
    drinkCount,
    drinkSize,
    drinkSetSize,
    drinkAddList,
    drinkNotPay,
    drinkCurrentTotal,
    drinkPayPrice,
    currentBagCount,
    useDiscountPrice,
    drinkTotalMoney,
    cartClearedNotice,
    suppressClearedNotice,
    currentDrinkCount,
  }
}, {
  persist: true,
})
