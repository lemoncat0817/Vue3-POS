<template>
  <div class="w-full h-full flex flex-col items-center">
    <!-- 飲料客製化上半部 -->
    <!-- 如果選擇糖度/冰塊菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 0" class="w-[95%] h-full ">
      <!-- 如果飲品可以客製化則顯示 -->
      <div v-if="drinkStore.drinkItem.customized != 'none'" class="w-full h-full flex flex-col items-center">
        <div class="w-full h-full flex flex-wrap ">
          <div @click="changeSugar(item.name)" v-for="item in drinkStore.drinkSugar" :key="item.id"
            class="w-20 h-20 bg-red-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center "
            :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetSugar }">
            <p class="text-blue-800 text-xl font-bold select-none	">{{ item.name }}</p>
          </div>
        </div>
        <div class="w-full h-full flex ">
          <div class="w-[70%] h-full flex flex-wrap ">
            <div @click="changeIce(item.name)" v-for="item in filterIce" :key="item.id"
              class="w-20 h-20 bg-green-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center"
              :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetIce }">
              <p class="text-blue-800 text-xl font-bold select-none	">{{ item.name }}</p>
            </div>
          </div>
          <div class="w-[30%] h-full flex flex-wrap ">
            <div @click="changeSize(item.name)" v-for="item in filterSize" :key="item.id"
              class="w-20 h-20 bg-blue-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center"
              :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetSize }">
              <p class="text-blue-800 text-xl font-bold select-none	">{{ item.name }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 如果飲品不能客製化則顯示 -->
      <div v-else class="w-full h-full">
        <p class="w-full h-full flex justify-center items-center text-blue-800 text-3xl font-bold">糖度/冰塊/大小 固定無法調整</p>
      </div>
    </div>
    <!-- 如果選擇加料菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 1" class="w-[95%] h-full ">
      <div class="w-full h-full flex flex-wrap  ">
        <div @click="changeAdd(item)" v-for="item in drinkStore.drinkAdd" :key="item.id"
          class="w-20 h-20 bg-red-400 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center"
          :class="{ 'bg-yellow-400': drinkStore.drinkAddList.some(addItem => addItem.name === item.name) }">
          <p class="text-blue-800 text-xl font-bold select-none	">{{ item.name }}</p>
        </div>
      </div>
    </div>
    <!-- 飲料客製化下半部 -->
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <div class="h-full flex items-center">
        <div @click="drinkStore.drinkMenu = 0"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1"
          :class="{ 'bg-yellow-400': drinkStore.drinkMenu === 0 }">
          <p class="w-full h-full text-xl font-bold select-none	"> 糖度/冰塊/大小</p>
        </div>
        <div @click="drinkStore.drinkMenu = 1"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 mx-2 "
          :class="{ 'bg-yellow-400': drinkStore.drinkMenu === 1 }">
          <p class="w-full h-full text-xl font-bold select-none	">加料</p>
        </div>
        <div @click="resetAll"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 active:bg-yellow-400">
          <p class="w-full h-full text-xl font-bold select-none	">重置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { computed } from 'vue'

// 判定當前飲品是否能做為熱飲或是是否可以使用瓶裝容器相關功能
// 如果該品項不能做為熱飲，將熱飲選項篩選掉
const filterIce = computed(() => {
  if (drinkStore.drinkItem.customized === 'cold') {
    return drinkStore.drinkIce.filter(item => item.name != '熱')
  } else {
    return drinkStore.drinkIce
  }
})
// 如果該品項不能做成瓶裝，將瓶裝選項篩選掉
const filterSize = computed(() => {
  if (drinkStore.drinkItem.priceBottle === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != '瓶裝')
  } else {
    return drinkStore.drinkSize
  }
})

// 存入當前所選的糖度和冰塊以及杯子大小還有加料項目相關功能
// 存入當前所選的糖度
const changeSugar = (sugar) => {
  drinkStore.drinkSetSugar = sugar
}
// 存入當前所選的冰塊
const changeIce = (ice) => {
  drinkStore.drinkSetIce = ice
}
// 存入當前所選的杯子大小
const changeSize = (size) => {
  drinkStore.drinkSetSize = size
}
// 存入當前所選的加料項目，並判斷是否已存在於選項中，如果存在則刪除，反之則新增
const changeAdd = (addItem) => {
  if (drinkStore.drinkAddList.includes(addItem)) {
    drinkStore.drinkAddList = drinkStore.drinkAddList.filter(item => item != addItem)
  } else {
    drinkStore.drinkAddList.push(addItem)
  }
}

// 重置所有已選擇項目的相關功能
// 重置所有選項
const resetAll = () => {
  drinkStore.drinkTypeMenu = 'drinkSeasonal'
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = 'L杯'
  drinkStore.drinkAddList = []
}
</script>

<style lang="scss" scoped></style>