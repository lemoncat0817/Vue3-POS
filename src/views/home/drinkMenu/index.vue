<template>
  <div class="w-full h-full flex flex-col items-center">
    <div class="w-[90%] h-full flex flex-wrap ">
      <div @click="changeItem(item)" v-for="item in currentDrinks" :key="item.id"
        class="w-[95px] h-[95px] bg-red-400 border-solid border-2 border-black rounded-lg m-2 flex justify-center items-center cursor-pointer"
        :class="{ 'bg-yellow-300': item.name === drinkStore.drinkItem.name }">
        <p class="w-[85%] text-blue-800 text-xl font-bold flex justify-center">{{ item.name }}</p>
      </div>
    </div>
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">{{ `共${currentDrinks.length}樣` }}</p>
      <div>
        <el-button type="danger" icon="CaretLeft" class="w-2" disabled></el-button>
        <el-button type="danger" icon="CaretRight" class="w-2" disabled></el-button>
      </div>
      <p class="text-blue-800">1/1頁</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
// 存入當前所選的飲品選項
const changeItem = (item) => {
  drinkStore.drinkItem = item
}
// 計算當前所選的飲品系列並且回傳該系列的飲品
const currentDrinks = computed(() => {
  return drinkStore[drinkStore.drinkTypeMenu] || []
})
</script>

<style lang="scss" scoped></style>