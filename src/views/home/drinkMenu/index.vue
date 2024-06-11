<template>
  <div class="w-full h-full flex flex-col ">
    <!-- 飲料品項上半部 -->
    <div class="w-full h-full grid grid-cols-5 place-items-center">
      <div @click="changeItem(item)" v-for="item in sliceDrinkMenu" :key="item.id"
        class="2xl:w-28 2xl:h-28 xl:w-24 xl:h-24 lg:w-[72px] lg:h-[72px] w-14 h-14 bg-red-400 border-solid border-2 border-black rounded-lg  cursor-pointer flex justify-center items-center"
        :class="{ 'bg-yellow-400': item.name === drinkStore.drinkItem.name }">
        <p class="px-2 text-blue-800 2xl:text-xl xl:text-lg lg:text-sm text-xs font-bold select-none	">{{ item.name }}</p>
      </div>
    </div>
    <!-- 飲料品項下半部 -->
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">{{ `共 ${currentDrinks.length} 樣` }}</p>
      <div class="h-full flex items-center">
        <el-pagination v-model:current-page="currentPage" small background layout="prev, next"
          :total="currentDrinks.length" @current-change="handleCurrentChange" />
      </div>
      <p class="text-blue-800">{{ `${currentDrinks.length > 0 ? currentPage : 0}/${Math.ceil(currentDrinks.length / 10)}頁`
        }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
// 獲取當前所選飲品相關功能
// 存入當前所選的飲品選項
const changeItem = (item) => {
  drinkStore.drinkItem = item
}

// 計算當前系列包含的飲品相關功能
// 計算當前所選的飲品系列並且回傳該系列的飲品
const currentDrinks = computed(() => {
  if (drinkStore.drinkTypeMenu) {
    return drinkStore.drinkType.find(item => item.type === drinkStore.drinkTypeMenu).drinkList
  } else {
    return []
  }
})

// 切換頁數相關功能
// 頁數切換
const handleCurrentChange = (page) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceDrinkMenu = computed(() => {
  return currentDrinks.value.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
</script>

<style lang="scss" scoped></style>