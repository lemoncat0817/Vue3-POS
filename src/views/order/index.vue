<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="lg:w-4/5 w-[90%] w-full mt-10 flex flex-col items-center">
      <h1
        class="px-2 text-3xl text-white font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500">
        訂單</h1>
      <!-- 篩選功能 -->
      <div class="flex mt-5">
        <el-popover placement="bottom" title="輸入要查詢的訂單編號" :width="200" trigger="click">
          <div class="flex">
            <input v-model="filterOrderId"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入訂單編號" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選訂單編號</button>
          </template>
        </el-popover>
        <el-popover placement="bottom" title="輸入要查詢的訂單時間" :width="200" trigger="click">
          <div class="flex">
            <input v-model="filterOrderTime"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入訂單時間" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選訂單時間</button>
          </template>
        </el-popover>
        <el-popover placement="bottom" title="輸入要查詢的服務人員" :width="200" trigger="click">
          <div class="flex">
            <input v-model="filterOrderStaff"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入服務人員" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選服務人員</button>
          </template>
        </el-popover>
        <el-popover placement="bottom" title="輸入要查詢的訂單狀態" :width="200" trigger="click">
          <div class="flex">
            <input v-model="filterOrderStatus"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入訂單狀態" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選訂單狀態</button>
          </template>
        </el-popover>
        <el-popover placement="bottom" title="輸入要查詢的付款方式" :width="200" trigger="click">
          <div class="flex">
            <input v-model="filterOrderPayMethod"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入付款方式" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選付款方式</button>
          </template>
        </el-popover>
        <button @click="resetFilter"
          class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">重置篩選</button>
      </div>
    </div>
    <div class="lg:w-4/5 w-[90%] mt-10 ">
      <!-- 訂單資料表格 -->
      <el-table :data="sliceOrder" style="width: 100%; height: 530px;" empty-text="目前無訂單">
        <el-table-column width="30" type="expand">
          <template #default="{ row }">
            <div class="flex w-full justify-center mb-2">
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                已買袋子數量:
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.orderBagCount }}</p>個
              </div>
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                飲料杯數:
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.orderCupCount }}</p>杯
              </div>
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                訂單原始金額: $
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.orderTotalPrice }}</p>元
              </div>
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                已使用的優惠券:
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.discountName }}</p>
              </div>
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                優惠券折扣金額: $
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.orderDiscount }}</p>元
              </div>
              <div class="text-blue-800 font-bold 2xl:text-lg sm:text-sm text-xs mx-2 flex bg-gray-300 rounded-lg px-1">
                顧客應付金額: $
                <p class="text-red-500 font-bold 2xl:text-lg sm:text-sm text-xs mx-1">{{ row.orderPaymentPrice }}</p>元
              </div>
            </div>
            <el-table :data="row.orderData" border style="width: 100%">
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
                  <div
                    v-if="row.useDiscountPercent === '' && row.useDiscountMoney === '' && row.useDiscountFree === ''">
                    <p>目前無使用折扣</p>
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
                  <p>{{ row.totalPrice }}元</p>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="orderId" label="訂單編號" min-width="105" />
        <el-table-column align="center" prop="orderTime" label="訂單時間" min-width="160" />
        <el-table-column align="center" prop="staff" label="服務人員" min-width="130" />
        <el-table-column align="center" prop="orderStatus" label="訂單狀態" min-width="80" />
        <el-table-column align="center" label="訂單金額" width="160">
          <template #default="{ row }">
            <p>{{ row.orderPaymentPrice }} 元</p>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="orderPayment" label="付款方式" min-width="90" />
        <el-table-column fixed="right" align="right" label="操作" min-width="235">
          <template #default="{ row }">
            <div class="flex justify-end">
              <button @click="editOrderStatus(row.orderId)"
                class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 xl:text-lg text-md mx-1 px-1 select-none active:bg-yellow-300"
                :class="{ 'opacity-50': loginStore.userInfo.canEditOrderStatus === 'X', 'pointer-events-none': loginStore.userInfo.canEditOrderStatus === 'X' }">編輯訂單狀態</button>
              <button @click="deleteOrder(row.orderId)"
                class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 xl:text-lg text-md mx-1 px-1 select-none active:bg-yellow-300"
                :class="{ 'opacity-50': loginStore.userInfo.canDeleteOrder === 'X', 'pointer-events-none': loginStore.userInfo.canDeleteOrder === 'X' }">刪除訂單</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分頁器 -->
      <div class="w-full flex justify-between mt-5">
        <el-pagination v-model:current-page="currentPage" :background="true" layout=" prev, pager, next"
          :total="orderStore.order.length" @current-change="handleCurrentChange" />
        <div class="ml-5 text-xl text-blue-500 font-bold flex items-center">總共有<p class="mx-2 text-red-600">
            {{ filterOrder.length }}</p>筆訂單，當前頁面有<p class="mx-2 text-red-600">{{ sliceOrder.length }}</p>筆訂單
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import { ElMessageBox, ElMessage } from 'element-plus'

// 分頁相關功能
// 當前頁數
const currentPage = ref(1)
// 頁數切換
const handleCurrentChange = (page) => {
  currentPage.value = page
}
// 計算並切換當前頁面內容
const sliceOrder = computed(() => {
  return filterOrder.value.slice((currentPage.value - 1) * 10, currentPage.value * 10)
})

// 訂單資料處理相關功能
// 篩選的訂單編號
const filterOrderId = ref('')
const filterOrderTime = ref('')
const filterOrderStaff = ref('')
const filterOrderStatus = ref('')
const filterOrderPayMethod = ref('')
// 篩選訂單清單
const filterOrder = computed(() => {
  return orderStore.order.filter(item => {
    return item.orderId.match(filterOrderId.value) &&
      item.orderTime.match(filterOrderTime.value) &&
      item.staff.match(filterOrderStaff.value) &&
      item.orderStatus.match(filterOrderStatus.value) &&
      item.orderPayment.match(filterOrderPayMethod.value)
  })
})
// 重置篩選功能
const resetFilter = () => {
  filterOrderId.value = ''
  filterOrderTime.value = ''
  filterOrderStaff.value = ''
  filterOrderStatus.value = ''
  filterOrderPayMethod.value = ''
}

// 訂單操作相關功能
// 編輯訂單狀態
const editOrderStatus = (id) => {
  ElMessageBox.confirm(
    '請選擇當前的訂單狀態',
    '修改訂單狀態',
    {
      confirmButtonText: '已完成',
      cancelButtonText: '已取消',
      type: 'info',
    }
  ).then(() => {
    orderStore.order.find(item => item.orderId === id).orderStatus = '已完成'
    ElMessage.success('訂單狀態已設定為已完成')
  }).catch(() => {
    orderStore.order.find(item => item.orderId === id).orderStatus = '已取消'
    ElMessage.success('訂單狀態已設定為已取消')
  })
}
// 刪除訂單
const deleteOrder = (id) => {
  ElMessageBox.confirm(
    '是否要該筆刪除訂單?',
    '警告',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    orderStore.order = orderStore.order.filter(item => item.orderId != id)
    ElMessage.success('刪除成功')
  }).catch(() => {
    ElMessage.error('取消操作')
  })
}

</script>

<style scoped></style>