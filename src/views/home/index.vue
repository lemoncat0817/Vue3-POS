<template>
  <div class="flex overflow-auto ">
    <!-- 左半部 -->
    <div class="w-3/5 ">
      <!-- 資訊顯示欄 -->
      <div class="w-full h-[70px] flex bg-red-300 shadow-xl rounded-lg">
        <!-- 資訊顯示欄左半部 -->
        <div class="w-1/2 h-full">
          <!-- 當前時間 -->
          <div class="w-full h-1/2 flex items-center">
            <div class="ml-2 text-lg flex">
              <p class="mr-2 font-bold text-lg">{{ getDate() }}</p>
              <p class="font-bold text-lg">{{ time }}</p>
            </div>
          </div>
          <!-- 機台編號和班別 -->
          <div class="flex w-full h-1/2 items-center">
            <div class="mx-2 flex ">
              <p class="text-blue-500 mr-2 font-bold text-lg">機台編號</p>
              <p class="font-bold text-lg">A</p>
            </div>
            <div class=" flex">
              <p class="text-blue-500 mr-2 font-bold text-lg">班別</p>
              <p class="font-bold text-lg">{{ getMoment() }}</p>
            </div>
          </div>
        </div>
        <!-- 資訊顯示欄右半部 -->
        <div class="w-1/2 h-full">
          <div class="h-full flex justify-between  mr-2">
            <div class="flex-col">
              <!-- 購買袋子數量 -->
              <div class="flex mr-2">
                <p class="text-blue-500 mr-2 font-bold ">購買袋子數量</p>
                <p class=" flex justify-end font-bold">{{ drinkStore.currentBagCount }} 個</p>
              </div>
              <!-- 當前飲料杯數 -->
              <div class="flex mr-2">
                <p class="text-blue-500 mr-2 font-bold ">當前飲料杯數</p>
                <p class=" flex justify-end font-bold">{{ drinkStore.currentDrinkCount }} 杯</p>
              </div>
              <!-- 當前付款方式 -->
              <div class="flex mr-2">
                <p class="text-blue-500 mr-2 font-bold ">當前付款方式</p>
                <p class=" flex justify-end font-bold">{{ orderStore.payment }}</p>
              </div>
            </div>
            <div class="flex-col">
              <!-- 目前累積金額 -->
              <div class="flex justify-end">
                <p class="text-blue-500 mr-2 font-bold ">目前累積金額</p>
                <p class=" flex justify-end font-bold">$ {{ drinkStore.drinkTotalMoney }} 元</p>
              </div>
              <!-- 優惠券已折抵金額 -->
              <div class="flex justify-end">
                <p class="text-blue-500 mr-2 font-bold ">優惠券已折抵</p>
                <p class=" flex justify-end font-bold">$ {{ drinkStore.useDiscountPrice }} 元</p>
              </div>
              <!-- 顧客應付價格 -->
              <div class="flex justify-end">
                <p class="text-blue-500 mr-2 font-bold">顧客應付金額</p>
                <p class=" flex justify-end font-bold">$ {{ drinkStore.drinkPayPrice }} 元</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 單號、服務人員、功能按鈕以及待付款清單 -->
      <div class="w-full h-[527px]">
        <!--  -->
        <div class="w-full h-[10%] bg-gray-200 shadow-xl rounded-lg flex">
          <!-- 單號、服務人員、功能按鈕左半部 -->
          <div class="w-1/2 h-full flex justify-around items-center">
            <!-- 單號 -->
            <div class="flex h-1/2 items-center">
              <p class="mr-2 text-blue-500 font-bold text-lg">單號:</p>
              <p class="text-red-500 font-bold text-lg"> {{ `${getDateForOrder()}${orderStore.currentOrderNumber}` }}
              </p>
            </div>
            <!-- 服務人員 -->
            <div class="w-1/2 h-full flex items-center">
              <p class="text-blue-500 mr-2 font-bold text-lg">服務人員:</p>
              <p class="text-red-400 font-bold text-lg ">愛喝奶茶的貓咪</p>
            </div>
          </div>
          <!-- 單號、服務人員、功能按鈕右半部 -->
          <div class="w-1/2 h-full flex items-center">
            <!-- 功能按鈕 -->
            <div class="w-full h-full flex items-center justify-end">
              <!-- 刪除已勾選商品 -->
              <button @click="clearSelectNotPay"
                class="bg-red-300 text-blue-800 text-lg font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 select-none active:bg-yellow-300">刪除已勾選品項</button>
              <!-- 清空全部品項 -->
              <button @click="clearNotPay"
                class="bg-red-300 text-blue-800 text-lg font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 select-none active:bg-yellow-300">清空全部品項</button>
              <!-- 修改付款方式 -->
              <button @click="openPayMethodMenu"
                class="bg-red-300 text-blue-800 text-lg font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 select-none active:bg-yellow-300">修改付款方式</button>
              <!-- 付款方式選單 -->
              <el-dialog v-model="dialogPayMethod" title="選擇付款方式" width="500">
                <div class="w-full h-[112px] flex grid grid-cols-4 grid-rows-3 gap-2">
                  <div @click="selectPayMethod(item)" v-for="item in slicePayMethod" :key="item.id"
                    class="w-28 h-8 border-2 border-solid border-black rounded-lg text-center px-2 bg-red-300 cursor-pointer"
                    :class="{ 'bg-yellow-400': orderStore.currentSelectingPayment === item.name, 'pointer-events-none': item.disabled, 'opacity-50': item.disabled }">
                    <p class="text-blue-800 font-bold text-xl">{{ item.name }}</p>
                  </div>
                </div>
                <!-- 付款方式分頁器 -->
                <div class="w-[468px] h-10 mt-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
                  <p class="text-blue-800">{{ `共 ${orderStore.paymentList.length} 樣` }}</p>
                  <div class="h-full flex items-center">
                    <el-pagination v-model:current-page="payMethodCurrentPage" small background layout="prev, next"
                      :total="orderStore.paymentList.length" :page-size="12"
                      @current-change="handlePayMethodCurrentChange" />
                  </div>
                  <p class="text-blue-800">{{ `${orderStore.paymentList.length > 0 ? payMethodCurrentPage : 0
                    }/${Math.ceil(orderStore.paymentList.length / 12)}頁` }}</p>
                </div>
                <template #footer>
                  <div>
                    <el-button @click="closePayMethod">取消</el-button>
                    <el-button type="primary" @click="changePayMethod">
                      確定
                    </el-button>
                  </div>
                </template>
              </el-dialog>
              <!-- 送出訂單 -->
              <button @click="sendOrder"
                class="bg-red-300 text-blue-800 text-lg font-bold border-solid border-2 border-black rounded-lg mr-2 px-1 select-none active:bg-yellow-300">送出訂單</button>
            </div>
          </div>
        </div>
        <!-- 待付款清單 -->
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
                <div v-if="row.useDiscountPercent === '' && row.useDiscountMoney === '' && row.useDiscountFree === ''">
                  <p>無使用折扣</p>
                </div>
                <div v-else class="w-full flex justify-center">
                  <el-tag class="mx-0.5" type="primary" v-if="row.useDiscountFree != ''">
                    {{ row.useDiscountFree }}
                  </el-tag>
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
      <!-- 主要功能區、數量設置鍵盤 -->
      <div class="w-full h-[281px] flex border-solid border-t-2 border-gray-200">
        <!-- 主要功能區 -->
        <div class="w-[60%] h-[95%] mt-2 flex justify-center items-center flex-wrap">
          <!-- 載具 -->
          <button @click="scanCarrier"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">載具</button>
          <!-- 加購袋子 -->
          <button @click="openBagDialog"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">加購袋子</button>
          <!-- 加購袋子選單 -->
          <el-dialog v-model="dialogBag" title="加購袋子數量" width="500">
            <div class="w-[100%] mx-2">
              <el-slider v-model="bagCount" show-input />
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="closeBagCount">取消</el-button>
                <el-button type="primary" @click="changeBagCount">
                  確定
                </el-button>
              </div>
            </template>
          </el-dialog>
          <!-- 免費招待 -->
          <button @click="freeDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">免費招待</button>
          <!-- 環保折扣 -->
          <button @click="ecoDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">{{
              discountStore.oftenUseDiscount[0].name }}</button>
          <!-- 瓶裝折扣 -->
          <button @click="bottleDiscount"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">{{
              discountStore.oftenUseDiscount[1].name }}</button>
          <!-- 開收銀機 -->
          <button @click="openCashier"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">開收銀機</button>
          <!-- 優惠券 -->
          <button @click="openDiscountMenu"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">優惠券</button>
          <!-- 優惠券選單 -->
          <el-dialog v-model="dialogDiscount" title="選擇優惠券" width="500" class="h-[60%] overflow-auto">
            <div class="w-[100%] mx-2">
              <div class="h-full flex justify-center items-center">
                <div @click="changeMoneyDiscount"
                  class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1"
                  :class="{ 'bg-yellow-400': discountStore.discountMenu === 0 }">
                  <p class="w-full h-full text-xl font-bold">現金折扣券</p>
                </div>
                <div @click="changePercentDiscount"
                  class="h-[85%] text-blue-800 bg-red-400 border-solid border-2 rounded-lg border-black cursor-pointer px-1 mx-2 "
                  :class="{ 'bg-yellow-400': discountStore.discountMenu === 1 }">
                  <p class="w-full h-full text-xl font-bold">折數折扣券</p>
                </div>
              </div>
              <div v-if="discountStore.discountMenu === 0" class="h-[384px] my-2">
                <div class="h-[340px] mb-2">
                  <div @click="selectMoneyDiscount(item.id)" v-for="item in sliceMoneyDiscount" :key="item.id"
                    class="h-16 mb-1 flex justify-center items-center cursor-pointer bg-red-400 rounded-xl"
                    :class="{ 'bg-yellow-400': discountStore.moneySelectingDiscountId === item.id }">
                    <p class="text-3xl text-blue-500 font-bold select-none	">{{ item.name }}</p>
                  </div>
                </div>
                <!-- 現金折扣券分頁器 -->
                <div class="w-[468px] h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
                  <p class="text-blue-800">{{ `共 ${discountStore.moneyDiscount.length} 樣` }}</p>
                  <div class="h-full flex items-center">
                    <el-pagination v-model:current-page="moneyDiscountCurrentPage" small background layout="prev, next"
                      :total="discountStore.moneyDiscount.length" :page-size="5"
                      @current-change="handleMoneyDiscountCurrentChange" />
                  </div>
                  <p class="text-blue-800">{{ `${discountStore.moneyDiscount.length > 0 ? moneyDiscountCurrentPage : 0
                    }/${Math.ceil(discountStore.moneyDiscount.length / 5)}頁` }}</p>
                </div>
              </div>
              <div v-if="discountStore.discountMenu === 1" class="h-[384px] my-2">
                <div class="h-[340px] mb-2">
                  <div @click="selectPercentDiscount(item.id)" v-for="item in slicePercentDiscount" :key="item.id"
                    class="h-16 mb-1 flex justify-center items-center cursor-pointer bg-red-400 rounded-xl"
                    :class="{ 'bg-yellow-400': discountStore.percentSelectingDiscountId === item.id }">
                    <p class="text-3xl text-blue-500 font-bold select-none	">{{ item.name }}</p>
                  </div>
                </div>
                <!-- 折數折扣券分頁器 -->
                <div class="w-[468px] h-10 bg-gray-400 shadow-xl rounded-lg flex justify-around items-center">
                  <p class="text-blue-800">{{ `共 ${discountStore.percentDiscount.length} 樣` }}</p>
                  <div class="h-full flex items-center">
                    <el-pagination v-model:current-page="percentDiscountCurrentPage" small background
                      layout="prev, next" :total="discountStore.percentDiscount.length" :page-size="5"
                      @current-change="handlePercentDiscountCurrentChange" />
                  </div>
                  <p class="text-blue-800">{{ `${discountStore.percentDiscount.length > 0 ? percentDiscountCurrentPage :
                    0}/${Math.ceil(discountStore.percentDiscount.length / 5)}頁` }}</p>
                </div>
              </div>
            </div>
            <template #footer>
              <div>
                <el-button @click="closeDiscount">取消</el-button>
                <el-button type="primary" @click="useDiscount">
                  確定
                </el-button>
              </div>
            </template>
          </el-dialog>
          <!-- 九折 -->
          <button @click="oftenUseDiscount1"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">{{
              discountStore.oftenUseDiscount[2].name }}</button>
          <!-- 八五折 -->
          <button @click="oftenUseDiscount2"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">{{
              discountStore.oftenUseDiscount[3].name }}</button>
          <!-- 員工八折 -->
          <button @click="oftenUseDiscount3"
            class="w-24 h-24 bg-red-400 border-solid border-2 border-black rounded-xl mx-2 text-blue-800 font-bold text-xl select-none active:bg-yellow-300">{{
              discountStore.oftenUseDiscount[4].name }}</button>
        </div>
        <!-- 數量設置鍵盤 -->
        <div class="w-[30%] h-[95%] mt-2 bg-red-200 border-solid border-2 border-black rounded-xl">
          <div class="w-full h-1/5 flex items-center justify-around">
            <input v-model="drinkStore.drinkCount" oninput="value=value.replace(/[^\d]/g,'')" maxlength="5" disabled
              class="w-[65%] h-4/5 ml-2 border-solid border-2 border-black text-right p-2 text-blue-800 font-bold text-3xl 	" />
            <button @click="addCount('delete')"
              class="w-[20%] h-4/5 ml-2 bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-3xl select-none	 active:bg-yellow-300">←</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button @click="addCount('7')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">7</button>
            <button @click="addCount('8')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">8</button>
            <button @click="addCount('9')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">9</button>
            <button @click="addNewDrink"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">Key</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button @click="addCount('4')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">4</button>
            <button @click="addCount('5')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">5</button>
            <button @click="addCount('6')"
              class="w-[20%] bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">6</button>
            <button @click="drinkStore.drinkCount = '10'"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">10</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button @click="addCount('1')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">1</button>
            <button @click="addCount('2')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">2</button>
            <button @click="addCount('3')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">3</button>
            <button @click="drinkStore.drinkCount = '50'"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">50</button>
          </div>
          <div class="w-full h-1/5 flex items-center justify-around ">
            <button @click="addCount('0')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">0</button>
            <button @click="addCount('00')"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">00</button>
            <button @click="drinkStore.drinkCount = '0'"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">Reset</button>
            <button @click="drinkStore.drinkCount = '100'"
              class="w-[20%]  bg-red-400 text-blue-800 border-solid border-2 border-black rounded-xl font-bold text-xl select-none active:bg-yellow-300">100</button>
          </div>
        </div>
      </div>
    </div>
    <!-- 右半部 -->
    <div class="w-2/5  border-solid border-l-2 border-gray-200 ">
      <!-- 飲料類型 -->
      <div class="w-full h-[308px] ">
        <DrinkType />
      </div>
      <!-- 飲料品項 -->
      <div class="w-full h-[308px]">
        <DrinkMenu />
      </div>
      <!-- 飲料客製化 -->
      <div class="w-full h-[263px]">
        <DrinkCustomized />
      </div>
    </div>
  </div>
</template>

<script setup>
import { getDate, getMoment, getTime, getDateForOrder } from '@/utils/time'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import DrinkType from './drinkType/index.vue'
import DrinkMenu from './drinkMenu/index.vue'
import DrinkCustomized from './drinkCustomized/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { useDiscountStore } from '@/stores/discount'
const discountStore = useDiscountStore()
import { useOrderStore } from '@/stores/order'
const orderStore = useOrderStore()

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
    ElMessageBox.alert('飲品未選擇', '通知', {
      confirmButtonText: '繼續選取',
      type: 'info',
    })
    return
  }
  // 如果需客製化但沒選擇糖度不能送單
  if (drinkStore.drinkItem.customized != 'none') {
    if (drinkStore.drinkSetSugar === '') {
      ElMessageBox.alert('糖度未選擇', '通知', {
        confirmButtonText: '繼續選取',
        type: 'info',
      })
      return
    }
  }
  // 如果需客製化但沒選擇冰塊不能送單
  if (drinkStore.drinkItem.customized != 'none') {
    if (drinkStore.drinkSetIce === '') {
      ElMessageBox.alert('冰塊未選擇', '通知', {
        confirmButtonText: '繼續選取',
        type: 'info',
      })
      return
    }
  }
  // 如果需客製化但沒選擇容器大小不能送單
  if (drinkStore.drinkItem.customized != 'none') {
    if (drinkStore.drinkSetSize === '') {
      ElMessageBox.alert('容器大小未選擇', '通知', {
        confirmButtonText: '繼續選取',
        type: 'info',
      })
      return
    }
  } // 如果不需客製化則容器大小固定為L杯
  else {
    drinkStore.drinkSetSize = 'L杯'
  }
  // 如果杯數小於一杯不能送單
  if (drinkStore.drinkCount < 1) {
    ElMessageBox.alert('飲料杯數不能小於一杯', '通知', {
      confirmButtonText: '繼續設定',
      type: 'info',
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
    useDiscountFree: '',
    freeDiscount: false,
    ecoDiscount: false,
    bottleDiscount: false,
    oftenUseDiscount1: false,
    oftenUseDiscount2: false,
    oftenUseDiscount3: false,
  }
  // 送出訂單至待付款區
  drinkStore.drinkNotPay.push(newDrink)
  // 成功送單後將菜單區重置
  drinkStore.drinkTypeMenu = ''
  drinkStore.drinkItem = []
  drinkStore.drinkSetSugar = ''
  drinkStore.drinkSetIce = ''
  drinkStore.drinkSetSize = ''
  drinkStore.drinkAddList = []
  drinkStore.drinkCount = '0'
}

// 刪除待付款的清單項目相關功能
// 清除待付款的清單所有項目
const clearNotPay = () => {
  if (drinkStore.drinkNotPay.length === 0) {
    ElMessageBox.alert('待付款清單為空，無法清空項目', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info',
    })
  } else {
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
}
// 定義已勾選的待付款項目的清單
const drinkSelectList = ref([])
// 待付款項目勾選後將勾選的項目存入已選取清單
const handleSelectionChange = (drinkSelect) => {
  drinkSelectList.value = drinkSelect
}
// 清除待付款的清單已選項目
const clearSelectNotPay = () => {
  if (drinkSelectList.value.length === 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info',
    })
  } else {
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
// 關閉修改選單
const closeBagCount = () => {
  dialogBag.value = false
  ElMessage.error('取消操作')
}
// 修改目前加購的袋子數量
const changeBagCount = () => {
  drinkStore.currentBagCount = bagCount.value
  dialogBag.value = false
  ElMessage.success('修改加購袋子數量成功')
}

// 掃描載具已及開啟收銀機相關功能
// 掃描載具
const scanCarrier = () => {
  ElMessageBox.alert('請掃描載具條碼', '通知', {
    confirmButtonText: '掃描完成',
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
// 免費招待
const freeDiscount = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  } else {
    drinkSelectList.value.forEach(item => {
      item.freeDiscount = !item.freeDiscount
      item.ecoDiscount = false
      item.bottleDiscount = false
      item.oftenUseDiscount1Discount = false
      item.oftenUseDiscount2Discount = false
      item.oftenUseDiscount3Discount = false
    })
    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.freeDiscount) {
        item.currentDiscountMoney = 0
        item.currentDiscountPercent = 0
        item.useDiscountFree = '招待'
        item.useDiscountMoney = ''
        item.useDiscountPercent = ''
        item.totalPrice = Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountPercent = 1
        item.useDiscountFree = ''
        item.totalPrice = Math.round(originalPrice * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}
// 環保折扣
const ecoDiscount = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  }
  else if (drinkSelectList.value.every(item => item.freeDiscount)) {
    ElMessageBox.alert('選取的品項中有品項尚未取消免費招待無法再添加折扣', '通知', {
      confirmButtonText: '重新選取',
      type: 'info'
    })
  } else {
    drinkSelectList.value.forEach(item => {
      item.ecoDiscount = !item.ecoDiscount
      item.bottleDiscount = false
    })
    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.ecoDiscount) {
        item.currentDiscountMoney = discountStore.oftenUseDiscount[0].discountMoney
        item.useDiscountMoney = discountStore.oftenUseDiscount[0].name
        item.totalPrice = Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountMoney = 0
        item.useDiscountMoney = ''
        item.totalPrice = Math.round(originalPrice * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}
// 瓶裝折扣
const bottleDiscount = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  } else {
    if (drinkSelectList.value.every(item => item.freeDiscount)) {
      ElMessageBox.alert('選取的品項中有品項尚未取消免費招待無法再添加折扣', '通知', {
        confirmButtonText: '重新選取',
        type: 'info'
      })
    }
    else if (drinkSelectList.value.every(item => item.size === 'bottle')) {
      drinkSelectList.value.forEach(item => {
        item.bottleDiscount = !item.bottleDiscount
        item.ecoDiscount = false
      })
    } else {
      ElMessageBox.alert('選取的所有品項都要是瓶裝才可以使用此功能', '通知', {
        confirmButtonText: '重新選取品項',
        type: 'info'
      })
      return
    }

    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.bottleDiscount) {
        item.currentDiscountMoney = discountStore.oftenUseDiscount[1].discountMoney
        item.useDiscountMoney = discountStore.oftenUseDiscount[1].name
        item.totalPrice = Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountMoney = 0
        item.useDiscountMoney = ''
        item.totalPrice = Math.round(originalPrice * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}
// 常用折數折扣1
const oftenUseDiscount1 = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  } else if (drinkSelectList.value.every(item => item.freeDiscount)) {
    ElMessageBox.alert('選取的品項中有品項尚未取消免費招待無法再添加折扣', '通知', {
      confirmButtonText: '重新選取',
      type: 'info'
    })
  } else {
    drinkSelectList.value.forEach(item => {
      item.oftenUseDiscount1 = !item.oftenUseDiscount1
      item.oftenUseDiscount2 = false
      item.oftenUseDiscount3 = false
    })
    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.oftenUseDiscount1) {
        item.currentDiscountPercent = discountStore.oftenUseDiscount[2].discountPercent
        item.useDiscountPercent = discountStore.oftenUseDiscount[2].name
        item.totalPrice = Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountPercent = 1
        item.useDiscountPercent = ''
        item.totalPrice = Math.round(originalPrice * item.currentDiscountPercent) - item.currentDiscountMoney * item.count
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}

// 常用折數折扣2
const oftenUseDiscount2 = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  } else if (drinkSelectList.value.every(item => item.freeDiscount)) {
    ElMessageBox.alert('選取的品項中有品項尚未取消免費招待無法再添加折扣', '通知', {
      confirmButtonText: '重新選取',
      type: 'info'
    })
  } else {
    drinkSelectList.value.forEach(item => {
      item.oftenUseDiscount2 = !item.oftenUseDiscount2
      item.oftenUseDiscount1 = false
      item.oftenUseDiscount3 = false
    })
    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.oftenUseDiscount2) {
        item.currentDiscountPercent = discountStore.oftenUseDiscount[3].discountPercent
        item.useDiscountPercent = discountStore.oftenUseDiscount[3].name
        item.totalPrice = Math.round(Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent))
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountPercent = 1
        item.useDiscountPercent = ''
        item.totalPrice = Math.round(Math.round(originalPrice * item.currentDiscountPercent) - item.currentDiscountMoney * item.count)
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}
// 常用折數折扣3
const oftenUseDiscount3 = () => {
  if (drinkSelectList.value <= 0) {
    ElMessageBox.alert('尚未選取品項', '通知', {
      confirmButtonText: '繼續選取品項',
      type: 'info'
    })
  } else if (drinkSelectList.value.every(item => item.freeDiscount)) {
    ElMessageBox.alert('選取的品項中有品項尚未取消免費招待無法再添加折扣', '通知', {
      confirmButtonText: '重新選取',
      type: 'info'
    })
  } else {
    drinkSelectList.value.forEach(item => {
      item.oftenUseDiscount3 = !item.oftenUseDiscount3
      item.oftenUseDiscount2 = false
      item.oftenUseDiscount1 = false
    })
    drinkSelectList.value.map(item => {
      const originalPrice = item.price * item.count + item.addListPrice * item.count
      if (item.oftenUseDiscount3) {
        item.currentDiscountPercent = discountStore.oftenUseDiscount[4].discountPercent
        item.useDiscountPercent = discountStore.oftenUseDiscount[4].name
        item.totalPrice = Math.round((originalPrice - item.currentDiscountMoney * item.count) * item.currentDiscountPercent)
        item.discount = originalPrice - item.totalPrice
      } else {
        item.currentDiscountPercent = 1
        item.useDiscountPercent = ''
        item.totalPrice = Math.round(originalPrice * item.currentDiscountPercent) - item.currentDiscountMoney * item.count
        item.discount = originalPrice - item.totalPrice
      }
      return item
    })
  }
}

// 優惠券相關功能
// 控制優惠券視窗開關
const dialogDiscount = ref(false)
// 打開折價券菜單
const openDiscountMenu = () => {
  if (drinkStore.drinkNotPay.length <= 0) {
    ElMessageBox.alert('待付款清單是空的無法使用優惠券', '通知', {
      confirmButtonText: '繼續選取',
      type: 'info',
    })
  } else {
    discountStore.moneySelectingDiscountId = discountStore.moneyDiscountId
    discountStore.percentSelectingDiscountId = discountStore.percentDiscountId
    dialogDiscount.value = true
  }
}
// 切換至現金折價券介面
const changeMoneyDiscount = () => {
  discountStore.discountMenu = 0
  discountStore.percentSelectingDiscountId = 0
}
// 切換至打折折價券介面
const changePercentDiscount = () => {
  discountStore.discountMenu = 1
  discountStore.moneySelectingDiscountId = 0
}
// 選取現金折價券
const selectMoneyDiscount = (id) => {
  if (discountStore.moneySelectingDiscountId === id) {
    discountStore.moneySelectingDiscountId = 0
  } else {
    discountStore.moneySelectingDiscountId = id
  }
}
// 現金折扣券分頁器
// 當前現金折扣券所選的頁數
const moneyDiscountCurrentPage = ref(1)
// 控制當前所選的頁數
const handleMoneyDiscountCurrentChange = (page) => {
  moneyDiscountCurrentPage.value = page
}
// 計算並切換當前現金折扣券頁面內容
const sliceMoneyDiscount = computed(() => {
  return discountStore.moneyDiscount.slice((moneyDiscountCurrentPage.value - 1) * 5, moneyDiscountCurrentPage.value * 5)
})
// 選取打折折價券
const selectPercentDiscount = (id) => {
  if (discountStore.percentSelectingDiscountId === id) {
    discountStore.percentSelectingDiscountId = 0
  } else {
    discountStore.percentSelectingDiscountId = id
  }
}
// 折數折扣券分頁器
// 當前折數折扣券所選的頁數
const percentDiscountCurrentPage = ref(1)
// 控制當前所選的頁數
const handlePercentDiscountCurrentChange = (page) => {
  percentDiscountCurrentPage.value = page
}
// 計算並切換當前折數折扣券頁面內容
const slicePercentDiscount = computed(() => {
  return discountStore.percentDiscount.slice((percentDiscountCurrentPage.value - 1) * 5, percentDiscountCurrentPage.value * 5)
})
// 關閉優惠券選單
const closeDiscount = () => {
  dialogDiscount.value = false
  ElMessage.error('操作取消')
}
// 使用優惠券
const useDiscount = () => {
  // 使用現金折價券
  if (discountStore.moneySelectingDiscountId != 0) {
    discountStore.moneyDiscountId = discountStore.moneySelectingDiscountId
    discountStore.currentMoneyDiscount = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId).discountMoney
    const currentMoneyDiscountName = discountStore.moneyDiscount.find(item => item.id === discountStore.moneyDiscountId).name
    discountStore.currentDiscountName = currentMoneyDiscountName
    discountStore.percentDiscountId = 0
    dialogDiscount.value = false
    ElMessage.success(`使用${currentMoneyDiscountName}成功`)
  }
  // 使用折數折價券
  if (discountStore.percentSelectingDiscountId != 0) {
    discountStore.percentDiscountId = discountStore.percentSelectingDiscountId
    discountStore.currentPercentDiscount = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId).discountMoney
    const currentPercentDiscountName = discountStore.percentDiscount.find(item => item.id === discountStore.percentDiscountId).name
    discountStore.currentDiscountName = currentPercentDiscountName
    discountStore.moneyDiscountId = 0
    dialogDiscount.value = false
    ElMessage.success(`使用${currentPercentDiscountName}成功`)
  }
  // 取消套用任何折價券
  if (discountStore.moneySelectingDiscountId === 0 && discountStore.percentSelectingDiscountId === 0) {
    discountStore.currentMoneyDiscount = 0
    discountStore.moneyDiscountId = 0
    discountStore.percentDiscountId = 0
    discountStore.currentDiscountName = ''
    dialogDiscount.value = false
    ElMessage.success('成功取消已套用的優惠券')
  }
}

// 送出訂單相關功能
// 初始化送單資料格式
// 控制付款方式視窗開關
const dialogPayMethod = ref(false)
// 打開付款方式菜單
const openPayMethodMenu = () => {
  dialogPayMethod.value = true
  orderStore.currentSelectingPayment = orderStore.payment
}
// 取消編輯付款方式
const closePayMethod = () => {
  dialogPayMethod.value = false
  ElMessage.error('操作取消')
}
// 付款方式分頁器
// 定義付款方式頁面當前頁數
const payMethodCurrentPage = ref(1)
// 控制當前所選的頁數
const handlePayMethodCurrentChange = (page) => {
  payMethodCurrentPage.value = page
}
// 計算並切換當前付款方式頁面內容
const slicePayMethod = computed(() => {
  return orderStore.paymentList.slice((payMethodCurrentPage.value - 1) * 12, payMethodCurrentPage.value * 12)
})
// 選擇付款方式
const selectPayMethod = (item) => {
  orderStore.currentSelectingPayment = item.name
  orderStore.currentSelectingUseMethod = item.useMethod
}
// 更改付款方式
const changePayMethod = () => {
  orderStore.payment = orderStore.currentSelectingPayment
  orderStore.useMethod = orderStore.currentSelectingUseMethod
  dialogPayMethod.value = false
  ElMessage.success('付款方式更改成功')
}
// 送出訂單
const sendOrder = () => {
  if (drinkStore.drinkNotPay.length <= 0 && drinkStore.currentBagCount <= 0) {
    ElMessageBox.alert('訂單內沒有品項無法送單', '通知', {
      confirmButtonText: '繼續添加品項',
      type: 'info',
    })
    return
  } else {
    ElMessageBox.confirm(
      '確定要送出訂單嗎?',
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      if (orderStore.useMethod === '感應') {
        ElMessageBox.alert(`應支付$${drinkStore.drinkPayPrice}元,請感應${orderStore.payment}`, '通知', {
          confirmButtonText: '感應完成',
          type: 'info',
        }).then(() => {
          resetOrder()
        })
      } else if (orderStore.useMethod === '紙鈔') {
        ElMessageBox.alert(`應收取現金$${drinkStore.drinkPayPrice}元`, '通知', {
          confirmButtonText: '收取現金',
          type: 'info',
        }).then(() => {
          resetOrder()
        })
      } else {
        ElMessageBox.alert(`應支付$${drinkStore.drinkPayPrice}元,請掃描${orderStore.payment}條碼`, '通知', {
          confirmButtonText: '掃描完成',
          type: 'info',
        }).then(() => {
          resetOrder()
        })
      }
      const resetOrder = () => {
        // 送出訂單的格式
        const toPayOrder = {
          orderId: `${getDateForOrder()}${orderStore.currentOrderNumber}`,
          orderTime: `${getDate()} ${getTime()}`,
          orderStatus: '已完成',
          staff: '愛喝奶茶的貓咪',
          orderData: drinkStore.drinkNotPay,
          orderBagCount: drinkStore.currentBagCount,
          orderCupCount: drinkStore.currentDrinkCount,
          orderTotalPrice: drinkStore.drinkTotalMoney,
          orderPayment: orderStore.payment,
          orderDiscount: drinkStore.useDiscountPrice,
          orderPaymentPrice: drinkStore.drinkPayPrice,
          discountName: discountStore.currentDiscountName === '' ? '無' : discountStore.currentDiscountName,
        }
        orderStore.order.push(toPayOrder)
        ElMessage.success('訂單送出成功')
        drinkStore.drinkNotPay = []
        orderStore.payment = '現金'
        orderStore.currentOrderNumber++
      }
    }).catch(() => {
      ElMessage.error('取消操作')
    })
  }
}
</script>

<style lang="scss" scoped></style>