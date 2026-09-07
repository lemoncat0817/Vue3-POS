<template>
  <div class="w-full h-full flex flex-col ">
    <!-- 飲料品項上半部 -->
    <div class="w-full h-full grid grid-cols-5 place-items-center">
      <div
v-for="item in sliceDrinkMenu" :key="item.id" class="2xl:w-28 2xl:h-28 xl:w-24 xl:h-24 lg:w-[72px] lg:h-[72px] md:w-14 md:h-14 sm:w-12 sm:h-12 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg  cursor-pointer flex justify-center items-center"
        :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300': item.name === fromSelection(drinkStore.drinkItem)?.name }"
        @click="changeItem(item)">
        <p class="md:px-2 px-1 text-surface-700 dark:text-surface-100 2xl:text-xl xl:text-lg lg:text-sm md:text-xs sm:text-[10px] text-[8px] font-bold select-none	">{{ item.name }}</p>
      </div>
    </div>
    <!-- 飲料品項下半部 -->
    <!-- P8：el-pagination 只用了 prev/next 兩顆按鈕，改用原生按鈕，取代
         el-pagination（見 home/index.vue 的說明，同一輪組件庫替換）。 -->
    <div class="w-full h-10 bg-surface-100 dark:bg-surface-800 shadow-xl rounded-lg flex justify-around items-center">
      <p class="text-surface-700 dark:text-surface-100">{{ `共 ${currentDrinks.length} 樣` }}</p>
      <div class="h-full flex items-center gap-2">
        <button
          type="button" class="rounded border border-surface-400 dark:border-surface-600 px-2 text-surface-700 dark:text-surface-100 disabled:opacity-40"
          :disabled="currentPage <= 1" @click="handleCurrentChange(currentPage - 1)">‹</button>
        <button
          type="button" class="rounded border border-surface-400 dark:border-surface-600 px-2 text-surface-700 dark:text-surface-100 disabled:opacity-40"
          :disabled="currentPage >= pageCount" @click="handleCurrentChange(currentPage + 1)">›</button>
      </div>
      <p class="text-surface-700 dark:text-surface-100">{{ `${currentDrinks.length > 0 ? currentPage : 0}/${pageCount}頁`
        }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDrinkStore } from '@/stores/drink'
import type { DrinkListItem } from '@/types'
import { fromSelection } from '@/utils/selection'
const drinkStore = useDrinkStore()
// 獲取當前所選飲品相關功能
// 存入當前所選的飲品選項
const changeItem = (item: DrinkListItem) => {
  drinkStore.drinkItem = item
}

// 計算當前系列包含的飲品相關功能
// 計算當前所選的飲品系列並且回傳該系列的飲品
const currentDrinks = computed(() => {
  if (drinkStore.drinkTypeMenu) {
    // drinkTypeMenu 只會被設成 drinkType 裡真實存在的 type 值（見
    // drinkType/index.vue 的 changeType），因此這裡的 find 在實務上必定
    // 命中；用非空斷言保留原本「找不到就丟錯」的行為，不悄悄改成空陣列。
    return drinkStore.drinkType.find(item => item.type === drinkStore.drinkTypeMenu)!.drinkList
  } else {
    return []
  }
})

// 切換頁數相關功能
// 頁數切換
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceDrinkMenu = computed(() => {
  return currentDrinks.value.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(currentDrinks.value.length / 10), 1))
</script>

<style lang="scss" scoped></style>