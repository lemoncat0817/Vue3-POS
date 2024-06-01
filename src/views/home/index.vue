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
          <div class="h-full flex flex-col justify-center float-right mr-2">
            <div class="flex justify-end ">
              <p class="text-blue-500">購買袋子數量</p>
              <p class="w-16 flex justify-end">{{ currentBagCount }} 個</p>
            </div>
            <div class="flex justify-end">
              <p class="text-blue-500">顧客應付價格</p>
              <p class="w-16 flex justify-end">1 元</p>
            </div>
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
              <button @click="clearSelectNotPay"
                class="bg-red-300 text-blue-800 font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 active:bg-yellow-300">刪除已勾選品項</button>
              <button @click="clearNotPay"
                class="bg-red-300 text-blue-800 font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 active:bg-yellow-300">清空全部品項</button>
            </div>
          </div>
        </div>
        <div class="w-full h-[90%]">
          <el-table @selection-change="handleSelectionChange" :data="drinkStore.drinkNotPay" border height="100%"
            style="width: 100%" empty-text="目前無待付款的飲品">
            <el-table-column align="center" type="selection" min-width="20" />
            <el-table-column align="center" center label="序號" type="index" min-width="30" />
            <el-table-column align="center" label="商品" min-width="80" prop="name" />
            <el-table-column align="center" label="單價" min-width="60">
              <template #default="{ row }">
                <p>{{ row.price }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="加料" prop="addList" min-width="80" />
            <el-table-column align="center" label="配料金額" min-width="60">
              <template #default="{ row }">
                <p> {{ row.addListPrice }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="數量" prop="count" min-width="60">
              <template #default="{ row }">
                <p> {{ row.count }} 杯</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="折扣金額" min-width="60">
              <template #default="{ row }">
                <p> {{ row.discount }} 元</p>
              </template>
            </el-table-column>
            <el-table-column align="center" label="使用的折扣" min-width="80">
              <template #default="{ row }">
                <div v-if="row.useDiscountPercent === '' && row.useDiscountMoney === ''">
                  <p>目前無使用折扣</p>
                </div>
                <div v-else class="w-full flex justify-center">
                  <el-tag class="mx-0.5" type="danger" v-if="row.useDiscountPercent != ''">
                    {{ row.useDiscountPercent }}
                  </el-tag>
                  <el-tag class="mx-0.5" type="warning" v-if="row.useDiscountMoney != ''">
                    {{ row.useDiscountMoney }}
                  </el-tag>
                </div>
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
          <button @click="scanCarrier"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">載具</button>
          <button @click="openBagDialog"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">加購袋子</button>
          <el-dialog v-model="dialogBag" title="加購袋子數量" width="500">
            <div class="w-[100%] mx-2">
              <el-slider v-model="bagCount" show-input />
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="dialogBag = false">取消</el-button>
                <el-button type="primary" @click="changeBagCount">
                  確定
                </el-button>
              </div>
            </template>
          </el-dialog>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">買五送一</button>
          <button @click="ecoDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">環保折扣</button>
          <button @click="bottleDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">瓶裝折扣</button>
          <button @click="openCashier"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">開收銀機</button>
          <button @click="tenOffDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">九折</button>
          <button @click="fifteenOffDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">八五折</button>
          <button @click="twentyOffDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">員工八折</button>
          <button
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl active:bg-yellow-300">自訂折扣</button>
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

// 杯數相關功能
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

// 添加至待付款區相關功能
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
    size: drinkStore.drinkSetSize === 'L杯' ? 'L' : 'bottle',
    count: parseInt(drinkStore.drinkCount),
    discount: 0,
    addList: drinkStore.drinkAddList.map(item => item.name) == '' ? '無添加配料' : drinkStore.drinkAddList.map(item => item.name),
    addListPrice: drinkStore.drinkAddList.reduce((acc, cur) => acc + cur.price, 0),
    totalPrice: drinkStore.drinkCurrentTotal,
    currentDiscountPercent: 1,
    currentDiscountMoney: 0,
    useDiscountPercent: '',
    useDiscountMoney: '',
    ecoDiscount: false,
    bottleDiscount: false,
    tenOffDiscount: false,
    fifteenOffDiscount: false,
    twentyOffDiscount: false,
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

// 刪除待付款的清單項目相關功能
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
// 定義已勾選的待付款項目的清單
const drinkSelectList = ref([])
// 待付款項目勾選後將勾選的項目存入已選取清單
const handleSelectionChange = (drinkSelect) => {
  drinkSelectList.value = drinkSelect
}
// 清除待付款的清單已選項目
const clearSelectNotPay = () => {
  ElMessageBox.confirm(
    '確定要清除所有已選的待付款的飲品嗎?',
    '警告',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('清除成功')
    drinkStore.drinkNotPay = drinkStore.drinkNotPay.filter(item => !drinkSelectList.value.includes(item))
  }).catch(() => {
    ElMessage.error('取消操作')
  })
}

// 控制袋子數量相關功能
// 控制加購袋子視窗
const dialogBag = ref(false)
// 定義袋子數量
const bagCount = ref(1)
// 打開加購袋子選單
const openBagDialog = () => {
  bagCount.value = 1
  dialogBag.value = true
}
// 定義目前加購的袋子數量
const currentBagCount = ref(0)
// 修改目前加購的袋子數量
const changeBagCount = () => {
  currentBagCount.value = bagCount.value
  dialogBag.value = false
}

// 掃描載具已及開啟收銀機相關功能
// 掃描載具
const scanCarrier = () => {
  ElMessageBox.alert('掃描載具條碼', '通知', {
    confirmButtonText: '開始掃描',
    type: 'info',
  })
}
// 開啟收銀機
const openCashier = () => {
  ElMessageBox.alert('開啟收銀機', '通知', {
    confirmButtonText: '確定',
    type: 'info',
  })
}

// 折扣相關功能
// 環保折扣
const ecoDiscount = () => {
  drinkSelectList.value.forEach(item => {
    item.ecoDiscount = !item.ecoDiscount
    item.bottleDiscount = false
  })
  drinkSelectList.value.map(item => {
    const originPrice = item.price * item.count + item.addListPrice * item.count
    if (item.ecoDiscount) {
      item.currentDiscountMoney = 5
      item.useDiscountMoney = '環保折扣'
      item.totalPrice = (originPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    } else {
      item.currentDiscountMoney = 0
      item.useDiscountMoney = ''
      item.totalPrice = originPrice * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    }
    return item
  })
}
// 瓶裝折扣
const bottleDiscount = () => {
  if (drinkSelectList.value.every(item => item.size === 'bottle')) {
    drinkSelectList.value.forEach(item => {
      item.bottleDiscount = !item.bottleDiscount
      item.ecoDiscount = false
    })
  } else {
    ElMessageBox.alert('選取的所有品項都要是瓶裝才可以使用此功能', '通知', {
      confirmButtonText: '重新選取品項',
      type: 'warning'
    })
    return
  }

  drinkSelectList.value.map(item => {
    const originPrice = item.price * item.count + item.addListPrice * item.count
    if (item.bottleDiscount) {
      item.currentDiscountMoney = 10
      item.useDiscountMoney = '瓶裝折扣'
      item.totalPrice = (originPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    } else {
      item.currentDiscountMoney = 0
      item.useDiscountMoney = ''
      item.totalPrice = originPrice * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    }
    return item
  })
}
// 九折
const tenOffDiscount = () => {
  drinkSelectList.value.forEach(item => {
    item.tenOffDiscount = !item.tenOffDiscount
    item.fifteenOffDiscount = false
    item.twentyOffDiscount = false
  })
  drinkSelectList.value.map(item => {
    const originPrice = item.price * item.count + item.addListPrice * item.count
    if (item.tenOffDiscount) {
      item.currentDiscountPercent = 0.9
      item.useDiscountPercent = '九折'
      item.totalPrice = (originPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    } else {
      item.currentDiscountPercent = 1
      item.useDiscountPercent = ''
      item.totalPrice = originPrice * item.currentDiscountPercent - item.currentDiscountMoney * item.count
      item.discount = originPrice - item.totalPrice
    }
    return item
  })
}

// 八五折
const fifteenOffDiscount = () => {
  drinkSelectList.value.forEach(item => {
    item.fifteenOffDiscount = !item.fifteenOffDiscount
    item.tenOffDiscount = false
    item.twentyOffDiscount = false
  })
  drinkSelectList.value.map(item => {
    const originPrice = item.price * item.count + item.addListPrice * item.count
    if (item.fifteenOffDiscount) {
      item.currentDiscountPercent = 0.85
      item.useDiscountPercent = '八五折'
      item.totalPrice = (originPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    } else {
      item.currentDiscountPercent = 1
      item.useDiscountPercent = ''
      item.totalPrice = originPrice * item.currentDiscountPercent - item.currentDiscountMoney * item.count
      item.discount = originPrice - item.totalPrice
    }
    return item
  })
}
// 員工八折
const twentyOffDiscount = () => {
  drinkSelectList.value.forEach(item => {
    item.twentyOffDiscount = !item.twentyOffDiscount
    item.fifteenOffDiscount = false
    item.tenOffDiscount = false
  })
  drinkSelectList.value.map(item => {
    const originPrice = item.price * item.count + item.addListPrice * item.count
    if (item.twentyOffDiscount) {
      item.currentDiscountPercent = 0.8
      item.useDiscountPercent = '員工八折'
      item.totalPrice = (originPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent
      item.discount = originPrice - item.totalPrice
    } else {
      item.currentDiscountPercent = 1
      item.useDiscountPercent = ''
      item.totalPrice = originPrice * item.currentDiscountPercent - item.currentDiscountMoney * item.count
      item.discount = originPrice - item.totalPrice
    }
    return item
  })
}

// 當前時間相關功能
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