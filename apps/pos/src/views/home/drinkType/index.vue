<template>
  <div class="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
    <button
      v-for="item in drinkStore.drinkType"
      :key="item.id"
      type="button"
      class="group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all duration-150 select-none shadow-sm cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
      :class="item.type === drinkStore.drinkTypeMenu
        ? 'border-primary-500 bg-primary-600 text-white shadow-md shadow-primary-600/25 ring-2 ring-primary-500/20'
        : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-750'"
      @click="changeType(item.type)">
      <span class="font-black">{{ item.name }}</span>
      <span
        class="text-xs px-1.5 py-0.5 rounded-full font-bold transition-colors"
        :class="item.type === drinkStore.drinkTypeMenu
          ? 'bg-primary-700 text-primary-100'
          : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'">
        {{ item.drinkList.length }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()

// 切換飲料系列相關功能
const changeType = (type: string) => {
  drinkStore.drinkTypeMenu = type
}

// 切換頁數相關功能
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
const currentPage = ref(1)
const sliceDrinkType = computed(() => {
  return drinkStore.drinkType.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkType.length / 10), 1))
</script>