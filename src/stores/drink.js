import { ref, watch, computed, onMounted } from 'vue'
import { defineStore } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()



export const useDrinkStore = defineStore('drink', () => {
  // 定義飲料品項資料
  // 定義各種系列的選項資料
  const drinkType = ref([
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

  // 定義客製化內容的選項資料
  // 定義冰塊的選項資料
  const drinkIce = ref([{
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
  // 定義糖度的選項資料
  const drinkSugar = ref([{
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
  // 定義加料的選項資料
  const drinkAdd = ref([{
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
  // 定義飲料大小的選項資料
  const drinkSize = ref([{
    "id": 1,
    "name": "L杯",
  },
  {
    "id": 2,
    "name": "瓶裝",
  }])

  // 存放當前所選的選項以及飲料相關資料
  // 存放當前所選的是糖度/冰塊還是加料選單
  // 預設為糖度/冰塊
  const drinkMenu = ref(0)
  // 存放當前所選的飲料系列
  const drinkTypeMenu = ref('')
  // 存放當前所選的茶類
  const drinkItem = ref([])
  // 存放當前所選的糖度
  const drinkSetSugar = ref('')
  // 存放當前所選的冰塊
  const drinkSetIce = ref('')
  // 存放當前所選的杯子大小
  const drinkSetSize = ref('')
  // 存放當前所選品項的飲料數量
  const drinkCount = ref('0')
  // 存放當前所選加料項目
  const drinkAddList = ref([])
  // 存放飲料待付款的飲料資料
  const drinkNotPay = ref([])
  // 計算目前小計金額
  const drinkCurrentTotal = computed(() => {
    if (drinkSetSize.value === 'L杯') {
      return drinkItem.value.priceL * drinkCount.value + drinkAddList.value.reduce((acc, cur) => acc + cur.price, 0) * drinkCount.value
    } else {
      return drinkItem.value.priceBottle * drinkCount.value + drinkAddList.value.reduce((acc, cur) => acc + cur.price, 0) * drinkCount.value
    }
  })
  // 計算目前總金額
  const drinkTotalMoney = computed(() => {
    return (Math.round(drinkNotPay.value.reduce((acc, cur) => acc
      + cur.totalPrice, 0)) + currentBagCount.value)
  })

  // 判定飲料選項菜單切換後重製其他客製化內容以及所選的品項
  // 當飲料系列改變清空已選茶類以及糖冰還有杯子大小的選項
  watch(() => drinkTypeMenu.value, () => {
    drinkItem.value = []
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = ''
    drinkAddList.value = []
  })
  // 當茶類改變清空已選糖冰還有杯子大小的選項
  watch(() => drinkItem.value, () => {
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = ''
    drinkAddList.value = []
  })
  // 初始化標誌
  const initialized = ref(false)
  // 組件掛載完成後設置為 true
  onMounted(() => {
    initialized.value = true
  })
  // 判定待付款清單是否清空
  watch(() => drinkNotPay.value, () => {
    // 如果未初始化，直接返回
    if (!initialized.value) return
    // 如果清單是空的清楚已添加的袋子以及重置套用的優惠券
    if (drinkNotPay.value.length === 0) {
      currentBagCount.value = 0
      discountStore.moneySelectingDiscountId = 0
      discountStore.moneyDiscountId = 0
      discountStore.currentMoneyDiscount = 0
      discountStore.percentDiscountId = 0
      discountStore.currentPercentDiscount = 0
      discountStore.percentSelectingDiscountId = 0
      discountStore.currentDiscountName = ''
      ElMessageBox.alert('待付款清單已無品項，套用優惠券以及加購的袋子數量已重置', '通知', {
        confirmButtonText: '繼續選取品項',
        type: 'info',
      })
    }
  })

  // 購物袋相關功能
  // 定義目前加購的袋子數量
  const currentBagCount = ref(0)
  // 送出訂單前顧客應付總額結算
  // 顧客應付款金額
  const drinkPayPrice = computed(() => {

    // 如果有套用優惠券
    if (discountStore.moneyDiscountId != 0) {
      if (Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - discountStore.currentMoneyDiscount) < 0) {
        return 0
      } else {
        return Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - discountStore.currentMoneyDiscount)
      }
    } else if (discountStore.percentDiscountId != 0) {
      return Math.round((Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value) * discountStore.currentPercentDiscount)
    } else {
      return Math.round(Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value)
    }
  })
  // 優惠券折抵額度
  const useDiscountPrice = computed(() => {
    return Math.round(drinkNotPay.value.reduce((acc, cur) => acc + cur.totalPrice, 0)) + currentBagCount.value - drinkPayPrice.value
  })

  return {
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
    drinkTotalMoney
  }
}, {
  persist: true,
})
