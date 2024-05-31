<template>
  <div class="w-full h-full flex flex-col ">
    <div class="w-[90%] h-full flex flex-wrap ml-10">
      <div @click="changeType(item.type)" v-for="item in sliceDrinkType" :key="item.id"
        class="w-28 h-28 bg-red-400 border-solid border-2 border-black rounded-lg m-2 flex justify-center items-center cursor-pointer"
        :class="{ 'bg-yellow-400': item.type === drinkStore.drinkTypeMenu }">
        <p class="text-blue-800 text-xl font-bold ">{{ item.name }}
        </p>
      </div>
    </div>
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">{{ `共${drinkStore.drinkType.length}樣` }}</p>
      <div class="h-full flex items-center">
        <el-pagination v-model:current-page="currentPage" small background layout="prev, next"
          :total="drinkStore.drinkType.length" @current-change="handleCurrentChange" />
      </div>
      <p class="text-blue-800">{{ `${currentPage}/${Math.ceil(drinkStore.drinkType.length / 10)}頁` }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
// 存放當前所選的飲料系列
const changeType = (type) => {
  drinkStore.drinkTypeMenu = type
}
// 頁數切換
const handleCurrentChange = (page) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
</script>

<style lang="scss" scoped></style>