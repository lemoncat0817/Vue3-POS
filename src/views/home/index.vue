<template>
  <div class=flex>
    <div class="w-3/5 h-calc">
      <div class="w-full h-[8%] flex bg-red-300 shadow-xl rounded-lg">
        <div class="w-1/2 h-full">
          <div class="w-full h-1/2 flex items-center">
            <div class="ml-2 text-lg flex">
              <p class="mr-2">{{ getDate() }}</p>
              <p>{{ time }}</p>
            </div>
          </div>
          <div class="flex w-full h-1/2 items-center">
            <div class="mx-2 flex ">
              <p class="text-blue-500 mr-2">機台編號</p>
              <p>A</p>
            </div>
            <div class=" flex">
              <p class="text-blue-500 mr-2">班別</p>
              <p>{{ getMoment() }}</p>
            </div>
          </div>
        </div>
        <div class="w-1/2 h-full">
          <div class="flex items-center float-right mr-2">
            <p class="mr-6 text-blue-500">總價 $</p>
            <p> 1000</p>
          </div>
        </div>
      </div>
      <div class="w-full h-[60%]">
        <div class="w-full h-[20%] bg-gray-200 shadow-xl rounded-lg flex">
          <div class="w-1/2 h-full">
            <div class="flex h-1/2 items-center">
              <p class="mx-2 text-blue-500">單號:</p>
              <input :placeholder="Date.now()" class="border-2 border-black rounded-3xl text-center">
            </div>
            <div class="flex h-1/2 items-center">
              <p class="mx-2 text-blue-500">會員:</p>
              <input placeholder="請輸入會員手機號碼" v-model="phoneNumber"
                class="border-2 border-black rounded-3xl text-center" />
            </div>
          </div>
          <div class="w-1/2 h-full flex items-center">
            <p class="text-blue-500 mr-2">服務人員:</p>
            <p class="text-red-400 font-bold">愛喝奶茶的貓咪</p>
          </div>
        </div>
        <div class="w-full h-[80%]">
          <el-table border style="width: 100%">
            <el-table-column label="序號" type="index" width="180" />
            <el-table-column label="商品" width="180" />
            <el-table-column label="單價" />
            <el-table-column label="數量" />
            <el-table-column label="折扣" />
            <el-table-column label="加料" />
            <el-table-column label="小計" />
          </el-table>
        </div>
      </div>
      <div class="w-full h-[32%] flex border-solid border-t-2 border-gray-200">
        <div class="w-[60%] h-[95%] mt-2 flex justify-center flex-wrap">
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">載具</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">會員資料</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">買五送一</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">環保杯折扣</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">瓶裝環保杯折扣</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">開收銀機</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">九折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">八五折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">折扣</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">員工折扣</button>
        </div>
        <div class="w-[30%] h-[95%] mt-2 bg-red-200 border-solid border-2 border-black rounded-xl  ">
          <div class="w-full h-1/5 flex items-center  ">
            <input maxlength="5" v-model="drinkStore.drinkCount"
              class="w-[65%] h-4/5 ml-2 border-solid border-2 border-black text-right p-2 text-blue-800 font-bold text-3xl active:bg-yellow-300" />
            <button @click="addCount('delete')"
              class="w-16 h-[80%] ml-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-3xl active:bg-yellow-300">←</button>
          </div>
          <div class="w-full h-1/5 flex items-center ">
            <button @click="addCount('7')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">7</button>
            <button @click="addCount('8')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">8</button>
            <button @click="addCount('9')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">9</button>
            <button
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">Key</button>
          </div>
          <div class="w-full h-1/5 flex items-center ">
            <button @click="addCount('4')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">4</button>
            <button @click="addCount('5')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">5</button>
            <button @click="addCount('6')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">6</button>
            <button @click="drinkStore.drinkCount = '10'"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">10</button>
          </div>
          <div class="w-full h-1/5 flex items-center ">
            <button @click="addCount('1')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">1</button>
            <button @click="addCount('2')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">2</button>
            <button @click="addCount('3')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">3</button>
            <button @click="drinkStore.drinkCount = '50'"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">50</button>
          </div>
          <div class="w-full h-1/5 flex items-center ">
            <button @click="addCount('0')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">0</button>
            <button @click="addCount('00')"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">00</button>
            <button @click="drinkStore.drinkCount = '0'"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">Reset</button>
            <button @click="drinkStore.drinkCount = '100'"
              class="w-[20%] ms-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl active:bg-yellow-300">100</button>
          </div>
        </div>
      </div>
    </div>
    <div class="w-2/5 h-calc border-solid border-l-2 border-gray-200 ">
      <div class="w-full h-[35%] ">
        <DrinkType />
      </div>
      <div class="w-full h-[35%]">
        <DrinkMenu />
      </div>
      <div class="w-full h-[30%]">
        <DrinkCustomized />
      </div>
    </div>
  </div>
</template>

<script setup>
import { getDate, getMoment, getTime } from '@/utils/time'
import { ref, onMounted, onUnmounted } from 'vue'
import DrinkType from './drinkType/index.vue'
import DrinkMenu from './drinkMenu/index.vue'
import DrinkCustomized from './drinkCustomized/index.vue'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
// 新增飲料杯數
const addCount = (num) => {
  // 如果按刪除鍵刪除最右側的數字
  // 如果刪除後只剩一個數字，則重置為0
  if (num === 'delete') {
    if (drinkStore.drinkCount === '' || drinkStore.drinkCount.length === 1) {
      drinkStore.drinkCount = '0'
      return
    } else {
      drinkStore.drinkCount = drinkStore.drinkCount.slice(0, -1)
      return
    }
  }
  // 防止杯數超出5位數
  if (num === '00') {
    if (drinkStore.drinkCount.length >= 4) {
      return
    }
  } else {
    if (drinkStore.drinkCount.length >= 5) {
      return
    }
  }
  // 如果當前杯數為0，則新增杯數時將預設的0清除
  if (drinkStore.drinkCount === '0') {
    drinkStore.drinkCount = ''
    // 如果杯數為0，則不允許按0  
    if (num === '0' || num === '00') {
      drinkStore.drinkCount = '0'
      return
    }
  }
  // 新增選擇的數字在杯數上
  drinkStore.drinkCount += num
}

// 存放客人的手機號碼
const phoneNumber = ref('')
// 存放當前時間
const time = ref('')
// 頁面刷新時當前時間開始跑
onMounted(() => {
  setInterval(() => {
    time.value = getTime()
  }, 1000);
})
// 離開頁面時當前時間清除
onUnmounted(() => {
  clearInterval()
})

</script>

<style lang="scss" scoped></style>