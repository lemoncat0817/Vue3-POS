<template>
  <div class="w-full flex flex-col">
    <!-- 飲料品項標題與分頁控制 -->
    <div class="flex items-center justify-between mb-2 px-1">
      <div class="flex items-center gap-2">
        <span class="text-xs font-black uppercase tracking-wider text-surface-500 dark:text-surface-400">飲品選單</span>
        <span class="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:text-surface-300">
          共 {{ currentDrinks.length }} 品項
        </span>
      </div>
      <div v-if="pageCount > 1" class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 disabled:opacity-30 hover:bg-surface-100 transition-colors shadow-sm"
          :disabled="currentPage <= 1" @click="handleCurrentChange(currentPage - 1)">‹</button>
        <span class="text-xs font-bold text-surface-500">{{ currentPage }}/{{ pageCount }}</span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 disabled:opacity-30 hover:bg-surface-100 transition-colors shadow-sm"
          :disabled="currentPage >= pageCount" @click="handleCurrentChange(currentPage + 1)">›</button>
      </div>
    </div>

    <!-- 飲品卡片網格 -->
    <div v-if="currentDrinks.length === 0" class="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 text-surface-400">
      <span class="text-sm font-bold">請先點選上方飲品系列以載入品項</span>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
      <button
        v-for="item in sliceDrinkMenu" :key="item.id"
        type="button"
        class="group relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all duration-150 select-none shadow-sm cursor-pointer hover:shadow-md active:scale-95"
        :class="{
          'border-primary-500 bg-primary-50/90 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/30 scale-[1.02]': item.name === fromSelection(drinkStore.drinkItem)?.name,
          'border-surface-200 dark:border-surface-700/80 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600': item.name !== fromSelection(drinkStore.drinkItem)?.name,
          'cursor-not-allowed opacity-40 pointer-events-none': isSoldOut(item),
        }"
        @click="changeItem(item)">
        <!-- 頂部標籤列 -->
        <div class="flex items-start justify-between w-full gap-1 mb-1.5">
          <span
            v-if="item.customized === 'none'"
            class="rounded-md bg-surface-100 dark:bg-surface-700/60 px-1.5 py-0.5 text-[9px] font-bold text-surface-500 dark:text-surface-400">
            固定
          </span>
          <span v-else class="rounded-md bg-success-50 dark:bg-success-950/40 px-1.5 py-0.5 text-[9px] font-bold text-success-600 dark:text-success-400">
            可調
          </span>

          <span
            v-if="isSoldOut(item)"
            class="rounded-full bg-danger-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">缺貨</span>
        </div>

        <!-- 品名 -->
        <p class="text-xs lg:text-sm font-black tracking-tight leading-snug line-clamp-2 select-none mb-2">
          {{ item.name }}
        </p>

        <!-- 價格 -->
        <div class="flex items-center justify-between mt-auto pt-1 border-t border-surface-100 dark:border-surface-700/50 w-full">
          <span class="text-xs lg:text-sm font-black text-primary-600 dark:text-primary-400">
            NT$ {{ item.priceL !== 'none' ? item.priceL : item.priceBottle }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDrinkStore } from '@/stores/drink'
import type { DrinkListItem } from '@/types'
import { fromSelection } from '@/utils/selection'
const drinkStore = useDrinkStore()

const isSoldOut = (item: DrinkListItem) => item.stock === 0

const changeItem = (item: DrinkListItem) => {
  if (isSoldOut(item)) return
  drinkStore.drinkItem = item
}

const currentDrinks = computed(() => {
  if (drinkStore.drinkTypeMenu) {
    return drinkStore.drinkType.find(item => item.type === drinkStore.drinkTypeMenu)!.drinkList
  } else {
    return []
  }
})

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
const currentPage = ref(1)
const sliceDrinkMenu = computed(() => {
  return currentDrinks.value.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(currentDrinks.value.length / 10), 1))
</script>