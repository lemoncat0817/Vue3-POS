<template>
  <div class="w-full h-full flex flex-col items-center">
    <div class="w-[90%] h-full flex flex-wrap ">
      <div @click="changeItem(item)" v-for="item in sliceDrinkMenu" :key="item.id"
        class="w-28 h-28 bg-red-400 border-solid border-2 border-black rounded-lg m-2 flex justify-center items-center cursor-pointer"
        :class="{ 'bg-yellow-400': item.name === drinkStore.drinkItem.name }">
        <p class="w-[85%] text-blue-800 text-xl font-bold flex justify-center select-none	">{{ item.name }}</p>
      </div>
    </div>
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">{{ `共${currentDrinks.length}樣` }}</p>
      <div class="h-full flex items-center">
        <el-pagination v-model:current-page="currentPage" small background layout="prev, next"
          :total="currentDrinks.length" @current-change="handleCurrentChange" />
      </div>
      <p class="text-blue-800">{{ `${currentPage}/${Math.ceil(currentDrinks.length / 10)}頁` }}</p>
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
  return drinkStore[drinkStore.drinkTypeMenu] || []
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