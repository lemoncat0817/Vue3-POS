<template>
  <div class="w-full h-full flex flex-col ">
    <!-- 飲料類型上半部 -->
    <div class="w-full h-full  grid grid-cols-5 place-items-center">
      <div
v-for="item in sliceDrinkType" :key="item.id" class="2xl:w-28 2xl:h-28 xl:w-24 xl:h-24 lg:w-[72px] lg:h-[72px]md:w-14 md:h-14 sm:w-12 sm:h-12 w-11 h-11 bg-red-400 border-solid border-2 border-black rounded-lg flex justify-center items-center cursor-pointer"
        :class="{ 'bg-yellow-400': item.type === drinkStore.drinkTypeMenu }"
        @click="changeType(item.type)">
        <p class="md:px-2 px-0.5 text-blue-800 2xl:text-xl xl:text-lg lg:text-sm md:text-xs sm:text-[10px] text-[8px] font-bold select-none	">{{ item.name }}
        </p>
      </div>
    </div>
    <!-- 飲料類型下半部 -->
    <!-- P8：el-pagination 只用了 prev/next 兩顆按鈕，改用原生按鈕，取代
         el-pagination（見 home/index.vue 的說明，同一輪組件庫替換）。 -->
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-blue-800">{{ `共 ${drinkStore.drinkType.length} 樣` }}</p>
      <div class="h-full flex items-center gap-2">
        <button
          type="button" class="rounded border border-surface-400 px-2 text-blue-800 disabled:opacity-40"
          :disabled="currentPage <= 1" @click="handleCurrentChange(currentPage - 1)">‹</button>
        <button
          type="button" class="rounded border border-surface-400 px-2 text-blue-800 disabled:opacity-40"
          :disabled="currentPage >= pageCount" @click="handleCurrentChange(currentPage + 1)">›</button>
      </div>
      <p class="text-blue-800">{{ `${drinkStore.drinkType.length > 0
        ? currentPage : 0}/${pageCount}頁` }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()

// 切換飲料系列相關功能
// 存放當前所選的飲料系列
const changeType = (type: string) => {
  drinkStore.drinkTypeMenu = type
}

// 切換頁數相關功能
// 頁數切換
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkType.length / 10), 1))
</script>

<style lang="scss" scoped></style>