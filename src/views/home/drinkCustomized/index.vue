<template>
  <div class="w-full h-full flex flex-col items-center">
    <!-- 飲料客製化上半部 -->
    <!-- 如果選擇糖度/冰塊菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 0" class="w-[95%] h-full">
      <!-- 如果飲品可以客製化則顯示 -->
      <div v-if="drinkStore.drinkItem.customized != 'none'" class="w-full h-full grid grid-rows-2 place-items-center">
        <div class="w-full h-full grid grid-cols-6 gap-x-4 place-items-center">
          <div @click="changeSugar(item.name)" v-for="item in drinkStore.drinkSugar" :key="item.id"
            class="xl:w-20 xl:h-20 lg:w-16 lg:h-16 md:w-12 md:h-12 sm:w-10 sm:h-10 w-9 h-9 bg-red-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center "
            :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetSugar }">
            <p
              class="text-blue-800 2xl:2xl:text-xl xl:text-lg xl:text-lg md:text-base sm:text-sm text-xs font-bold select-none	">
              {{ item.name }}</p>
          </div>
        </div>
        <div class="w-full h-full grid grid-cols-7 xl:gap-x-3 gap-x-4  place-items-center">
          <div @click="changeIce(item.name)" v-for="item in filterIce" :key="item.id"
            class="2xl:w-20 2xl:h-20 xl:w-[68px] xl:h-[68px] lg:w-[54px] lg:h-[50px] md:w-10 md:h-10 sm:w-8 sm:h-8 w-7 h-7 bg-green-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center"
            :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetIce }">
            <p class="text-blue-800 2xl:text-xl xl:text-lg lg:text-sm sm:text-[9px] text-[8px] font-bold select-none	">
              {{ item.name }}</p>
          </div>
          <div @click="changeSize(item.name)" v-for="item in filterSize" :key="item.id"
            class="2xl:w-20 2xl:h-20 xl:w-[68px] xl:h-[68px] lg:w-[54px] lg:h-[50px] md:w-10 md:h-10 sm:w-8 sm:h-8 w-7 h-7 bg-blue-300 border-solid border-2 rounded-lg m-2 cursor-pointer flex justify-center items-center"
            :class="{ 'bg-yellow-400': item.name === drinkStore.drinkSetSize }">
            <p class="text-blue-800 2xl:text-xl xl:text-lg lg:text-sm sm:text-[9px] text-[8px]  font-bold select-none	">
              {{ item.name }}</p>
          </div>
        </div>
      </div>
      <!-- 如果飲品不能客製化則顯示 -->
      <div v-else class="w-full h-full">
        <p
          class="w-full h-full flex justify-center items-center text-blue-800  xl:text-3xl lg:text-2xl text-xl font-bold">
          糖度/冰塊/大小 固定無法調整</p>
      </div>
    </div>
    <!-- 如果選擇加料菜單則顯示 -->
    <div v-if="drinkStore.drinkMenu === 1" class="w-full h-full ">
      <div class="w-full h-full grid grid-cols-5 place-items-center  ">
        <div @click="changeAdd(item)" v-for="item in sliceAddMenu" :key="item.id"
          class="2xl:w-26 2xl:h-26 xl:w-24 xl:h-24 lg:w-[72px] lg:h-[72px] md:w-14 md:h-14 sm:w-12 sm:h-12 w-11 h-11 bg-red-400 border-solid border-2 border-black rounded-lg  cursor-pointer flex justify-center items-center"
          :class="{ 'bg-yellow-400': drinkStore.drinkAddList.some(addItem => addItem.name === item.name) }">
          <p
            class="md:px-2 px-1 text-blue-800 2xl:text-xl xl:text-lg lg:text-sm md:text-xs sm:text-[10px] text-[8px] font-bold select-none">
            {{ item.name }}</p>
        </div>
      </div>
    </div>
    <!-- 飲料客製化下半部 -->
    <div class="w-full h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
      <div v-if="drinkStore.drinkMenu === 1"
        class="xl:w-1/2 lg:w-[45%] w-[70%] grid grid-cols-3 gap-x-2 place-items-center">
        <p class="text-blue-800 xl:text-base lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px]">{{ `共
          ${drinkStore.drinkAdd.length} 樣` }}</p>
        <div class="h-full flex items-center">
          <el-pagination v-model:current-page="currentPage" small background layout="prev, next"
            :total="drinkStore.drinkAdd.length" :page-size="10" @current-change="handleCurrentChange" />
        </div>
        <p class="text-blue-800 xl:text-base lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px]">{{
          `${drinkStore.drinkAdd.length > 0
            ? currentPage : 0}/${Math.ceil(drinkStore.drinkAdd.length / 10)}頁` }}</p>
      </div>
      <div class="h-full flex justify-center items-center lg:w-[55%] w-[80%]">
        <div @click="drinkStore.drinkMenu = 0"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 flex justify-center items-center"
          :class="{ 'bg-yellow-400': drinkStore.drinkMenu === 0 }">
          <p class="2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            糖度/冰塊/大小</p>
        </div>
        <div @click="drinkStore.drinkMenu = 1"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 mx-2 flex justify-center items-center"
          :class="{ 'bg-yellow-400': drinkStore.drinkMenu === 1 }">
          <p
            class=" 2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            加料</p>
        </div>
        <div @click="resetAll"
          class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 flex justify-center items-center active:bg-yellow-400">
          <p class="2xl:text-xl xl:text-lg lg:text-sm md:text-[10px] sm:text-[7.5px] text-[7px] font-bold select-none	">
            重置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus';

// 判定當前飲品是否能做為熱飲或是是否可以使用瓶裝容器相關功能
// 如果該品項不能做為熱飲，將熱飲選項篩選掉
const filterIce = computed(() => {
  if (drinkStore.drinkItem.customized === 'cold') {
    return drinkStore.drinkIce.filter(item => item.name != '熱')
  } else {
    return drinkStore.drinkIce
  }
})

const filterSize = computed(() => {
  // 如果該品項不能做成瓶裝，將瓶裝選項篩選掉
  if (drinkStore.drinkItem.priceBottle === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != '瓶裝')
  } // 如果該品項不能做成L杯，將L杯選項篩選掉
  else if (drinkStore.drinkItem.priceL === 'none') {
    return drinkStore.drinkSize.filter(item => item.name != 'L杯')
  } else {
    return drinkStore.drinkSize
  }
})

// 存入當前所選的糖度和冰塊以及杯子大小還有加料項目相關功能
// 存入當前所選的糖度
const changeSugar = (sugar) => {
  drinkStore.drinkSetSugar = sugar
}
// 存入當前所選的冰塊
const changeIce = (ice) => {
  drinkStore.drinkSetIce = ice
}
// 存入當前所選的杯子大小
const changeSize = (size) => {
  drinkStore.drinkSetSize = size
}
// 存入當前所選的加料項目，並判斷是否已存在於選項中，如果存在則刪除，反之則新增
const changeAdd = (addItem) => {
  if (drinkStore.drinkAddList.includes(addItem)) {
    drinkStore.drinkAddList = drinkStore.drinkAddList.filter(item => item != addItem)
  } else {
    drinkStore.drinkAddList.push(addItem)
  }
}

// 切換頁數相關功能
// 頁數切換
const handleCurrentChange = (page) => {
  currentPage.value = page
}
// 定義當前頁數
const currentPage = ref(1)
// 計算並切換當前頁面內容
const sliceAddMenu = computed(() => {
  return drinkStore.drinkAdd.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})

// 重置所有已選擇項目的相關功能
// 重置所有選項
const resetAll = () => {
  ElMessageBox.confirm(
    '是否要重置上面所有選項?',
    '警告',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      reset()
      ElMessage.success('重置成功')
    })
    .catch(() => {
      ElMessage.error('取消操作')
    })
  const reset = () => {
    drinkStore.drinkTypeMenu = ''
    drinkStore.drinkItem = []
    drinkStore.drinkSetSugar = ''
    drinkStore.drinkSetIce = ''
    drinkStore.drinkSetSize = ''
    drinkStore.drinkAddList = []
  }
}
</script>

<style lang="scss" scoped></style>