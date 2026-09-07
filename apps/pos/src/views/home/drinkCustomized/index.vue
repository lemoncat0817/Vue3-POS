<template>
  <!-- P11（規劃書 §12「視覺系統與體驗」）：糖度／冰塊／容器大小原本
       各自用滿版飽和的紅／綠／藍區分（bg-red-300／bg-green-300／
       bg-blue-300），選取態再疊一層飽和黃——三種類別用三種色相確實
       有幫助操作員快速分辨屬於哪一組，這個分類色的用意保留，只是把
       「滿版飽和填色＋純黑邊框」換成淡色調底＋同色系邊框，選取態統一
       改用品牌色淡底＋邊框強調（跟其餘頁面的選取態一致），兩套主題
       都能正確表達。 -->
  <div class="w-full h-full flex flex-col items-center">
    <!-- 飲料客製化上半部 -->
    <!-- 如果選擇糖度/冰塊菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 0" class="w-[95%] h-full">
      <!-- 如果飲品可以客製化則顯示 -->
      <div v-if="fromSelection(drinkStore.drinkItem)?.customized != 'none'" class="w-full h-full grid grid-rows-2 place-items-center">
        <div class="w-full h-full grid grid-cols-6 gap-x-4 place-items-center">
          <div
v-for="item in drinkStore.drinkSugar" :key="item.id" class="xl:w-20 xl:h-20 lg:w-16 lg:h-16 md:w-12 md:h-12 sm:w-10 sm:h-10 w-9 h-9 bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 rounded-lg m-2 cursor-pointer flex justify-center items-center "
            :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': item.name === drinkStore.drinkSetSugar }"
            @click="changeSugar(item.name)">
            <p
              class="text-surface-700 dark:text-surface-100 2xl:2xl:text-xl xl:text-lg xl:text-lg md:text-base sm:text-sm text-xs font-bold select-none	">
              {{ item.name }}</p>
          </div>
        </div>
        <div class="w-full h-full grid grid-cols-7 xl:gap-x-3 gap-x-4  place-items-center">
          <div
v-for="item in filterIce" :key="item.id" class="2xl:w-20 2xl:h-20 xl:w-[68px] xl:h-[68px] lg:w-[54px] lg:h-[50px] md:w-10 md:h-10 sm:w-8 sm:h-8 w-7 h-7 bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 rounded-lg m-2 cursor-pointer flex justify-center items-center"
            :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': item.name === drinkStore.drinkSetIce }"
            @click="changeIce(item.name)">
            <p class="text-surface-700 dark:text-surface-100 2xl:text-xl xl:text-lg lg:text-sm sm:text-[9px] text-[8px] font-bold select-none	">
              {{ item.name }}</p>
          </div>
          <div
v-for="item in filterSize" :key="item.id" class="2xl:w-20 2xl:h-20 xl:w-[68px] xl:h-[68px] lg:w-[54px] lg:h-[50px] md:w-10 md:h-10 sm:w-8 sm:h-8 w-7 h-7 bg-info-50 dark:bg-info-950/30 border border-info-200 dark:border-info-800 rounded-lg m-2 cursor-pointer flex justify-center items-center"
            :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': item.name === drinkStore.drinkSetSize }"
            @click="changeSize(item.name)">
            <p class="text-surface-700 dark:text-surface-100 2xl:text-xl xl:text-lg lg:text-sm sm:text-[9px] text-[8px]  font-bold select-none	">
              {{ item.name }}</p>
          </div>
        </div>
      </div>
      <!-- 如果飲品不能客製化則顯示 -->
      <div v-else class="w-full h-full">
        <p
          class="w-full h-full flex justify-center items-center text-surface-700 dark:text-surface-100  xl:text-3xl lg:text-2xl text-xl font-bold">
          糖度/冰塊/大小 固定無法調整</p>
      </div>
    </div>
    <!-- 如果選擇加料菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 1" class="w-full h-full ">
      <div class="w-full h-full grid grid-cols-5 place-items-center  ">
        <div
v-for="item in sliceAddMenu" :key="item.id" class="2xl:w-26 2xl:h-26 xl:w-24 xl:h-24 lg:w-[72px] lg:h-[72px] md:w-14 md:h-14 sm:w-12 sm:h-12 w-11 h-11 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg  cursor-pointer flex justify-center items-center"
          :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': drinkStore.drinkAddList.some(addItem => addItem.name === item.name) }"
          @click="changeAdd(item)">
          <p
            class="md:px-2 px-1 text-surface-700 dark:text-surface-100 2xl:text-xl xl:text-lg lg:text-sm md:text-xs sm:text-[10px] text-[8px] font-bold select-none">
            {{ item.name }}</p>
        </div>
      </div>
    </div>
    <!-- 飲料客製化下半部 -->
    <div class="w-full h-10 bg-surface-100 dark:bg-surface-800 shadow-xl rounded-lg flex justify-around items-center">
      <div
v-if="drinkStore.drinkMenu === 1"
        class="xl:w-1/2 lg:w-[45%] w-[70%] grid grid-cols-3 gap-x-2 place-items-center">
        <p class="text-surface-700 dark:text-surface-100 xl:text-base lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px]">{{ `共
          ${drinkStore.drinkAdd.length} 樣` }}</p>
        <!-- P8：el-pagination 只用了 prev/next 兩顆按鈕，改用原生按鈕，
             取代 el-pagination（見 home/index.vue 的說明，同一輪組件庫
             替換）。 -->
        <div class="h-full flex items-center gap-1">
          <button
            type="button" class="rounded border border-surface-400 dark:border-surface-600 px-1 text-surface-700 dark:text-surface-100 disabled:opacity-40"
            :disabled="currentPage <= 1" @click="handleCurrentChange(currentPage - 1)">‹</button>
          <button
            type="button" class="rounded border border-surface-400 dark:border-surface-600 px-1 text-surface-700 dark:text-surface-100 disabled:opacity-40"
            :disabled="currentPage >= pageCount" @click="handleCurrentChange(currentPage + 1)">›</button>
        </div>
        <p class="text-surface-700 dark:text-surface-100 xl:text-base lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px]">{{
          `${drinkStore.drinkAdd.length > 0
            ? currentPage : 0}/${pageCount}頁` }}</p>
      </div>
      <div class="h-full flex justify-center items-center lg:w-[55%] w-[80%]">
        <div
class="h-[85%] text-surface-700 dark:text-surface-100 bg-white dark:bg-surface-800 border rounded-lg border-surface-300 dark:border-surface-700 cursor-pointer px-1 flex justify-center items-center"
          :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': drinkStore.drinkMenu === 0 }"
          @click="drinkStore.drinkMenu = 0">
          <p class="2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            糖度/冰塊/大小</p>
        </div>
        <div
class="h-[85%] text-surface-700 dark:text-surface-100 bg-white dark:bg-surface-800 border rounded-lg border-surface-300 dark:border-surface-700 cursor-pointer px-1 mx-2 flex justify-center items-center"
          :class="{ 'border-primary-500 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300': drinkStore.drinkMenu === 1 }"
          @click="drinkStore.drinkMenu = 1">
          <p
            class=" 2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            加料</p>
        </div>
        <div
class="h-[85%] text-surface-700 dark:text-surface-100 bg-white dark:bg-surface-800 border rounded-lg border-surface-300 dark:border-surface-700 cursor-pointer px-1 flex justify-center items-center active:bg-danger-50 dark:active:bg-danger-950/40"
          @click="resetAll">
          <p class="2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            重置</p>
        </div>
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

// 判定當前飲品是否能做為熱飲或是是否可以使用瓶裝容器相關功能
// 如果該品項不能做為熱飲，將熱飲選項篩選掉
const filterIce = computed(() => {
  if (fromSelection(drinkStore.drinkItem)?.customized === 'cold') {
    return drinkStore.drinkIce.filter(item => item.name != '熱')
  } else {
    return drinkStore.drinkIce
  }
})

const filterSize = computed(() => {
  // 如果該品項不能做成瓶裝，將瓶裝選項篩選掉
  if (fromSelection(drinkStore.drinkItem)?.priceBottle === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != '瓶裝')
  } // 如果該品項不能做成L杯，將L杯選項篩選掉
  else if (fromSelection(drinkStore.drinkItem)?.priceL === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != 'L杯')
  } else {
    return drinkStore.drinkSize
  }
})

// 存入當前所選的糖度和冰塊以及杯子大小還有加料項目相關功能
// 存入當前所選的糖度
const changeSugar = (sugar: string) => {
  drinkStore.drinkSetSugar = sugar
}
// 存入當前所選的冰塊
const changeIce = (ice: string) => {
  drinkStore.drinkSetIce = ice
}
// 存入當前所選的杯子大小
const changeSize = (size: string) => {
  drinkStore.drinkSetSize = size
}
// 存入當前所選的加料項目，並判斷是否已存在於選項中，如果存在則刪除，反之則新增
const changeAdd = (addItem: DrinkAddOnOption) => {
  if (drinkStore.drinkAddList.includes(addItem)) {
    drinkStore.drinkAddList = drinkStore.drinkAddList.filter(item => item != addItem)
  } else {
    drinkStore.drinkAddList.push(addItem)
  }
}

// 切換頁數相關功能
// 頁數切換
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceAddMenu = computed(() => {
  return drinkStore.drinkAdd.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})
const pageCount = computed(() => Math.max(Math.ceil(drinkStore.drinkAdd.length / 10), 1))

// 重置所有已選擇項目的相關功能
// 重置所有選項
// P8：ElMessageBox.confirm／ElMessage 改用 composables/useConfirm.ts／
// useToast.ts（見 views/order/index.vue 的說明，同一套基礎設施）。
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