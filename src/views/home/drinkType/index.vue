<template>
  <div class="w-full h-full flex flex-col ">
    <div class="w-[90%] h-full flex flex-wrap ml-10">
      <div @click="changeType(item.type)" v-for="item in drinkStore.drinkType" :key="item.id"
        class="w-28 h-28 bg-red-400 border-solid border-2 border-black rounded-lg m-2 flex justify-center items-center cursor-pointer"
        :class="{ 'bg-yellow-300': item.type === drinkStore.drinkTypeMenu }">
        <p class="text-blue-800 text-xl font-bold ">{{ item.name }}
        </p>
      </div>
    </div>
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">共8類</p>
      <div>
        <el-button type="danger" icon="CaretLeft" class="w-2" disabled></el-button>
        <el-button type="danger" icon="CaretRight" class="w-2" disabled></el-button>
      </div>
      <p class="text-blue-800">1/1頁</p>
    </div>
  </div>
</template>

<script setup>
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
// 存放當前所選的飲料系列
const changeType = (type) => {
  drinkStore.drinkTypeMenu = type
}
</script>

<style lang="scss" scoped></style>