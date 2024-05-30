import { ref, watch } from 'vue'
import { defineStore } from 'pinia'


export const useDrinkStore = defineStore('drink', () => {
  // 定義各種系列的選項資料
  const drinkType = ref([
    {
      "id": 1,
      "name": "季節限定",
      "type": "drinkSeasonal"
    },
    {
      "id": 2,
      "name": "果粒茶系列",
      "type": "drinkFreshFruit"
    },
    {
      "id": 3,
      "name": "原味茶",
      "type": "drinkOriginal"
    },
    {
      "id": 4,
      "name": "香醇系列",
      "type": "drinkFreshMilk"
    },
    {
      "id": 5,
      "name": "芝芝系列",
      "type": "drinkCheese"
    },
    {
      "id": 6,
      "name": "鮮果茶飲",
      "type": "drinkFreshJuice"
    },
    {
      "id": 7,
      "name": "濃醇系列",
      "type": "drinkMilk"
    },
    {
      "id": 8,
      "name": "獨家特調",
      "type": "drinkSpecial"
    }
  ])
  // 定義季節限定的選項資料
  const drinkSeasonal = ref([{
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
  }])
  // 定義果粒茶系列的選項資料
  const drinkFreshFruit = ref([{
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
  }
  ])
  // 定義原味茶的選項資料
  const drinkOriginal = ref([{
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
  }])
  // 定義香醇系列的選項資料
  const drinkFreshMilk = ref([{
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
  }])
  // 定義芝芝系列的選項資料
  const drinkCheese = ref([{
    "id": 1,
    "name": "芝芝金萱/錫蘭紅茶",
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
    "name": "芝芝錫蘭奶茶",
    "priceL": 65,
    "priceBottle": "none",
    "customized": "both"
  },
  {
    "id": 7,
    "name": "芝芝阿華田",
    "priceL": 80,
    "priceBottle": "none",
    "customized": "both"
  },
  {
    "id": 8,
    "name": "芝芝可可",
    "priceL": 85,
    "priceBottle": "none",
    "customized": "both"
  }])
  // 定義鮮果茶飲的選項資料
  const drinkFreshJuice = ref([{
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
    "name": "檸檬綠茶/紅茶",
    "priceL": 45,
    "priceBottle": "none",
    "customized": "both"
  },
  {
    "id": 8,
    "name": "蜂蜜檸檬",
    "priceL": 55,
    "priceBottle": "none",
    "customized": "cold"
  },
  {
    "id": 9,
    "name": "檸檬多多",
    "priceL": 60,
    "priceBottle": "none",
    "customized": "cold"
  },
  {
    "id": 10,
    "name": "檸檬梅子",
    "priceL": 50,
    "priceBottle": "none",
    "customized": "both"
  }])
  // 定義濃醇系列的選項資料
  const drinkMilk = ref([{
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
  }])
  // 定義獨家特調的選項資料
  const drinkSpecial = ref([{
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
  }])
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
  // 存放當前所選的是糖度/冰塊還是加料選單
  // 預設為糖度/冰塊
  const drinkMenu = ref(0)
  // 存放當前所選的飲料系列
  const drinkTypeMenu = ref('drinkSeasonal')
  // 存放當前所選的茶類
  const drinkItem = ref([])
  // 存放當前所選的糖度
  const drinkSetSugar = ref('')
  // 存放當前所選的冰塊
  const drinkSetIce = ref('')
  // 存放當前所選的杯子大小
  const drinkSetSize = ref('L杯')
  // 存放當前所選品項的飲料數量
  const drinkCount = ref('0')
  // 當飲料系列改變清空已選茶類以及糖冰還有杯子大小的選項
  watch(() => drinkTypeMenu.value, () => {
    drinkItem.value = []
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = 'L杯'
  })
  // 當茶類改變清空已選糖冰還有杯子大小的選項
  watch(() => drinkItem.value, () => {
    drinkSetSugar.value = ''
    drinkSetIce.value = ''
    drinkSetSize.value = 'L杯'
  })

  return {
    drinkSeasonal,
    drinkFreshFruit,
    drinkOriginal,
    drinkFreshMilk,
    drinkCheese,
    drinkFreshJuice,
    drinkMilk,
    drinkSpecial,
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
    drinkSetSize
  }
}, {
  persist: true,
})