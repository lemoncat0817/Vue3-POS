<template>
  <div class="w-full flex flex-col rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 shadow-sm">
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-surface-100 dark:border-surface-800">
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-surface-900 dark:text-surface-100">規格客製</span>
        <span v-if="fromSelection(drinkStore.drinkItem)" class="text-xs font-bold text-primary-600 dark:text-primary-400">
          「{{ fromSelection(drinkStore.drinkItem)?.name }}」
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <div class="flex rounded-xl bg-surface-100 dark:bg-surface-800 p-0.5 text-xs font-bold">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors select-none"
            :class="drinkStore.drinkMenu === 0
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
            @click="drinkStore.drinkMenu = 0">
            糖度/冰塊/大小
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-colors select-none"
            :class="drinkStore.drinkMenu === 1
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'"
            @click="drinkStore.drinkMenu = 1">
            加料 <span v-if="drinkStore.drinkAddList.length > 0" class="text-primary-600 font-bold">({{ drinkStore.drinkAddList.length }})</span>
          </button>
        </div>

        <button
          type="button"
          class="rounded-lg border border-surface-200 dark:border-surface-700 px-2 py-1 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 dark:hover:bg-danger-950/40 transition-colors select-none"
          @click="resetAll">
          重置
        </button>
      </div>
    </div>

    <div v-if="drinkStore.drinkMenu === 0" class="flex flex-col gap-2.5 min-h-[140px] justify-center">
      <div v-if="fromSelection(drinkStore.drinkItem)?.customized != 'none'" class="flex flex-col gap-2.5">
        <div class="flex items-center gap-2">
          <span class="w-12 text-xs font-bold text-surface-500 dark:text-surface-400 shrink-0 text-center">糖度</span>
          <div class="flex flex-wrap items-center gap-1.5 flex-1">
            <button
              v-for="item in drinkStore.drinkSugar" :key="item.id"
              type="button"
              class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all select-none border"
              :class="item.name === drinkStore.drinkSetSugar
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm scale-[1.03]'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
              @click="changeSugar(item.name)">
              {{ item.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="w-12 text-xs font-bold text-surface-500 dark:text-surface-400 shrink-0 text-center">冰度</span>
          <div class="flex flex-wrap items-center gap-1.5 flex-1">
            <button
              v-for="item in filterIce" :key="item.id"
              type="button"
              class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all select-none border"
              :class="item.name === drinkStore.drinkSetIce
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm scale-[1.03]'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
              @click="changeIce(item.name)">
              {{ item.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="w-12 text-xs font-bold text-surface-500 dark:text-surface-400 shrink-0 text-center">規格</span>
          <div class="flex flex-wrap items-center gap-1.5 flex-1">
            <button
              v-for="item in filterSize" :key="item.id"
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all select-none border"
              :class="item.name === drinkStore.drinkSetSize
                ? 'border-primary-500 bg-primary-600 text-white shadow-sm scale-[1.03]'
                : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
              @click="changeSize(item.name)">
              {{ item.name }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-6 text-surface-400 dark:text-surface-500">
        <span class="text-sm font-bold">此飲品為黃金比例配方，糖度／冰塊／大小固定不可調整</span>
      </div>
    </div>

    <div v-if="drinkStore.drinkMenu === 1" class="flex flex-col gap-2 min-h-[140px]">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <button
          v-for="item in sliceAddMenu" :key="item.id"
          type="button"
          class="relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all select-none cursor-pointer"
          :class="{
            'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/20': drinkStore.drinkAddList.some(addItem => addItem.name === item.name),
            'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-white dark:hover:bg-surface-700': !drinkStore.drinkAddList.some(addItem => addItem.name === item.name),
            'cursor-not-allowed opacity-40 pointer-events-none': isAddOnSoldOut(item),
          }"
          @click="changeAdd(item)">
          <span class="text-xs font-bold">{{ item.name }}</span>
          <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1">
            +${{ item.price }}
          </span>
          <span v-if="isAddOnSoldOut(item)" class="absolute top-0.5 right-0.5 rounded-full bg-danger-600 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">缺貨</span>
        </button>
      </div>

      <div v-if="pageCount > 1" class="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-500">
        <span>共 {{ drinkStore.drinkAdd.length }} 樣加料</span>
        <div class="flex items-center gap-1">
          <button
            type="button" class="h-6 w-6 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-30"
            :disabled="currentPage <= 1" @click="handleCurrentChange(currentPage - 1)">‹</button>
          <span>{{ currentPage }}/{{ pageCount }}</span>
          <button
            type="button" class="h-6 w-6 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-30"
            :disabled="currentPage >= pageCount" @click="handleCurrentChange(currentPage + 1)">›</button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-surface-100 dark:border-surface-800">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-surface-500 dark:text-surface-400 mr-1">杯數</span>
        <button
          type="button"
          class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 font-bold hover:bg-surface-100 text-sm flex items-center justify-center active:scale-95 select-none transition-colors"
          @click="decreaseCount">
          -
        </button>
        <span class="text-sm font-black font-mono px-2 min-w-[2.5rem] text-center text-primary-600 dark:text-primary-400">
          {{ drinkCountDisplay }} 杯
        </span>
        <button
          type="button"
          class="h-7 w-7 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 font-bold hover:bg-surface-100 text-sm flex items-center justify-center active:scale-95 select-none transition-colors"
          @click="increaseCount">
          +
        </button>

        <div class="flex items-center gap-1 ml-1">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="drinkCountDisplay === 1
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
            @click="setCount('1')">1</button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="drinkCountDisplay === 2
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
            @click="setCount('2')">2</button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="drinkCountDisplay === 3
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
            @click="setCount('3')">3</button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs font-black select-none transition-all active:scale-95 cursor-pointer"
            :class="drinkCountDisplay === 5
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100'"
            @click="setCount('5')">5</button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="text-right">
          <span class="text-[10px] text-surface-400 block leading-tight">單項小計</span>
          <span class="text-sm font-black text-surface-900 dark:text-surface-100 font-mono leading-tight">
            NT$ {{ Number.isNaN(drinkStore.drinkCurrentTotal) || !drinkStore.drinkCurrentTotal ? 0 : drinkStore.drinkCurrentTotal }}
          </span>
        </div>
        <button
          type="button"
          class="rounded-xl bg-primary-600 px-5 py-2 text-xs font-black text-white hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/25 transition-all select-none cursor-pointer"
          @click="emit('addDrink')">
          新增
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { ref, computed } from 'vue'
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import type { DrinkAddOnOption } from '@/types'
import { fromSelection } from '@/utils/selection'

const emit = defineEmits<{ (e: 'addDrink'): void }>()

const drinkCountDisplay = computed(() => {
  const count = parseInt(drinkStore.drinkCount)
  return isNaN(count) || count < 1 ? 1 : count
})

const setCount = (val: string) => {
  drinkStore.drinkCount = val
}

const decreaseCount = () => {
  const current = drinkCountDisplay.value
  if (current > 1) {
    drinkStore.drinkCount = String(current - 1)
  }
}

const increaseCount = () => {
  const current = drinkCountDisplay.value
  drinkStore.drinkCount = String(current + 1)
}

const filterIce = computed(() => {
  if (fromSelection(drinkStore.drinkItem)?.customized === 'cold') {
    return drinkStore.drinkIce.filter(item => item.name != '熱')
  } else {
    return drinkStore.drinkIce
  }
})

const filterSize = computed(() => {
  if (fromSelection(drinkStore.drinkItem)?.priceBottle === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != '瓶裝')
  } else if (fromSelection(drinkStore.drinkItem)?.priceL === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != 'L杯')
  } else {
    return drinkStore.drinkSize
  }
})

const changeSugar = (sugar: string) => {
  drinkStore.drinkSetSugar = sugar
}
const changeIce = (ice: string) => {
  drinkStore.drinkSetIce = ice
}
const changeSize = (size: string) => {
  drinkStore.drinkSetSize = size
}
// 配料庫存歸零視為缺貨不可加選
const isAddOnSoldOut = (item: DrinkAddOnOption) => item.stock === 0
const changeAdd = (addItem: DrinkAddOnOption) => {
  if (drinkStore.drinkAddList.includes(addItem)) {
    drinkStore.drinkAddList = drinkStore.drinkAddList.filter(item => item != addItem)
  } else {
    if (isAddOnSoldOut(addItem)) return
    drinkStore.drinkAddList.push(addItem)
  }
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
const currentPage = ref(1)
const sliceAddMenu = computed(() => {
  return drinkStore.drinkAdd.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkAdd.length / 10), 1))

const resetAll = async () => {
  const result = await confirm({
    title: '警告',
    description: '是否要重置上面所有選項?',
  })
  if (result !== 'confirm') return
  drinkStore.drinkTypeMenu = ''
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = ''
  drinkStore.drinkAddList = []
  showToast('重置成功', 'success')
}
</script>

<style lang="scss" scoped></style>