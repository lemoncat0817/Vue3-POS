<template>
  <div class="flex">
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
        <div class="w-full h-[10%] bg-gray-200 shadow-xl rounded-lg flex">
          <div class="w-1/2 h-full flex items-center">
            <div class="flex h-1/2 items-center">
              <p class="mx-2 text-blue-500">單號:</p>
              <input :placeholder="Date.now()" class="border-2 border-black rounded-3xl text-center">
            </div>
          </div>
          <div class="w-1/2 h-full flex items-center">
            <div class="w-1/2 h-full flex items-center">
              <p class="text-blue-500 mr-2">服務人員:</p>
              <p class="text-red-400 font-bold">愛喝奶茶的貓咪</p>
            </div>
            <div class="w-1/2 h-full flex items-center justify-end">
              <button
                class="bg-red-300 text-blue-800 font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 active:bg-yellow-300">清空已選品項</button>
              <button @click="clearNotPay"
                class="bg-red-300 text-blue-800 font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 active:bg-yellow-300">清空全部品項</button>
            </div>
          </div>
        </div>
        <div class="w-full h-[90%]">
          <el-table :data="drinkStore.drinkNotPay" border height="100%" style="width: 100%" empty-text="目前無待付款的飲品">
            <el-table-column align="center" center label="序號" type="index" min-width="30" />
            <el-table-column align="center" label="商品" min-width="80" prop="name" />
            <el-table-column align="center" label="單價" min-width="60">
              <template #default="{ row }">
                <p>{{ row.price }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="數量" prop="count" min-width="60">
              <template #default="{ row }">
                <p> {{ row.count }} 杯</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="折扣" min-width="60">
              <template #default="{ row }">
                <p> {{ row.discount }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="加料" prop="addList" min-width="80" />
            <el-table-column align="center" label="配料金額" min-width="60">
              <template #default="{ row }">
                <p> {{ row.addListPrice }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="小計" min-width="60">
              <template #default="{ row }">
                <p> {{ row.totalPrice }}元</p>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="w-full h-[32%] flex border-solid border-t-2 border-gray-200">
        <div class="w-[60%] h-[95%] mt-2 flex justify-center flex-wrap">
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">載具</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">加購袋子</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">買五送一</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">環保折扣</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">瓶裝折扣</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">開收銀機</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">九折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">八五折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">員工八折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl">自訂折扣</button>
        </div>
        <div class="w-[30%] h-[95%] mt-2 bg-red-200 border-solid border-2 border-black rounded-xl  ">
          <div class="w-full h-1/5 flex items-center  ">
            <input v-model="drinkStore.drinkCount" oninput="value=value.replace(/[^\d]/g,'')" maxlength="5"
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
            <button @click="addNewDrink"
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
import { ElMessage, ElMessageBox } from 'element-plus'
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
// 添加飲料的資訊進入store
const addNewDrink = () => {
  // 如果沒選擇品項不能送單
  if (drinkStore.drinkItem.length === 0) {
    ElMessageBox.alert('飲品未選擇', '警告', {
      confirmButtonText: '繼續選取',
      type: 'warning',
    })
    return
  }
  // 如果需客製化但沒選擇糖度不能送單
  if (drinkStore.drinkItem.customized != 'none') {
    if (drinkStore.drinkSetSugar === '') {
      ElMessageBox.alert('糖度未選擇', '警告', {
        confirmButtonText: '繼續選取',
        type: 'warning',
      })
      return
    }
  }
  // 如果需客製化但沒選擇冰塊不能送單
  if (drinkStore.drinkItem.customized != 'none') {
    if (drinkStore.drinkSetIce === '') {
      ElMessageBox.alert('冰塊未選擇', '警告', {
        confirmButtonText: '繼續選取',
        type: 'warning',
      })
      return
    }
  }
  // 如果杯數小於一杯不能送單
  if (drinkStore.drinkCount < 1) {
    ElMessageBox.alert('飲料杯數不能小於一杯', '警告', {
      confirmButtonText: '繼續設定',
      type: 'warning',
    })
    return
  }
  // 送出訂單的格式
  const newDrink = {
    id: drinkStore.drinkNotPay.length + 1,
    name: drinkStore.drinkItem.customized === 'none' ? drinkStore.drinkItem.name : `${drinkStore.drinkItem.name},${drinkStore.drinkSetSugar}/${drinkStore.drinkSetIce},${drinkStore.drinkSetSize}`,
    price: drinkStore.drinkSetSize === 'L杯' ? drinkStore.drinkItem.priceL : drinkStore.drinkItem.priceBottle,
    count: parseInt(drinkStore.drinkCount),
    discount: 0,
    addList: drinkStore.drinkAddList.map(item => item.name),
    addListPrice: drinkStore.drinkAddList.reduce((acc, cur) => acc + cur.price, 0),
    totalPrice: 0,
  }
  // 送出訂單至待付款區
  drinkStore.drinkNotPay.push(newDrink)
  // 成功送單後將菜單區重置
  drinkStore.drinkTypeMenu = 'drinkSeasonal'
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = 'L杯'
  drinkStore.drinkAddList = []
  drinkStore.drinkCount = '0'
}
// 清除待付款的清單所有項目
const clearNotPay = () => {
  ElMessageBox.confirm(
    '確定要清除所有待付款的飲品嗎?',
    '警告',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('清除成功')
    drinkStore.drinkNotPay = []
  }).catch(() => {
    ElMessage.error('取消操作')
  })
}
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