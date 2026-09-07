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
            <input
v-model="filterOrderId"
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
            <input
v-model="filterOrderTime"
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
            <input
v-model="filterOrderStaff"
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
            <input
v-model="filterOrderStatus"
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
            <input
v-model="filterOrderPayMethod"
              class="w-[180px] h-[30px] text-center border-2 border-solid border-black rounded-lg bg-red-300 text-black font-bold placeholder:italic placeholder:text-black"
              placeholder="請輸入付款方式" />
          </div>
          <template #reference>
            <button
              class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300">篩選付款方式</button>
          </template>
        </el-popover>
        <button
class="md:px-2 px-1 border-2 border-solid border-black text-center md:mx-3 mx-1 text-blue-800 bg-red-500 rounded-lg font-bold 2xl:text-2xl xl:text-xl lg:text-md sm:text-sm text-xs select-none active:bg-yellow-300"
          @click="resetFilter">重置篩選</button>
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
                    <el-tag v-if="row.useDiscountFree != ''" class="mx-0.5" type="primary">
                      {{ row.useDiscountFree }}
                    </el-tag>
                    <el-tag v-if="row.useDiscountPercent != ''" class="mx-0.5" type="danger">
                      {{ row.useDiscountPercent }}
                    </el-tag>
                    <el-tag v-if="row.useDiscountMoney != ''" class="mx-0.5" type="warning">
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
              <button
class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 xl:text-lg text-md mx-1 px-1 select-none active:bg-yellow-300"
                :class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canEditOrderStatus === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canEditOrderStatus === 'X' }"
                @click="editOrderStatus(row.orderId)">編輯訂單狀態</button>
              <button
class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 xl:text-lg text-md mx-1 px-1 select-none active:bg-yellow-300"
                :class="{ 'opacity-50': fromSelection(loginStore.userInfo)?.canDeleteOrder === 'X', 'pointer-events-none': fromSelection(loginStore.userInfo)?.canDeleteOrder === 'X' }"
                @click="deleteOrder(row.orderId)">刪除訂單</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分頁器 -->
      <div class="w-full flex justify-between mt-5">
        <el-pagination
v-model:current-page="currentPage" :background="true" layout=" prev, pager, next"
          :total="orderStore.order.length" @current-change="handleCurrentChange" />
        <div class="ml-5 text-xl text-blue-500 font-bold flex items-center">總共有<p class="mx-2 text-red-600">
            {{ filterOrder.length }}</p>筆訂單，當前頁面有<p class="mx-2 text-red-600">{{ sliceOrder.length }}</p>筆訂單
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { useLoginStore } from "@/stores/login"
const loginStore = useLoginStore()
import { ElMessageBox, ElMessage } from 'element-plus'
import { fromSelection } from '@/utils/selection'
import { deleteOrder as deleteOrderRequest, updateOrderStatus } from '@/api/orders'
import { ApiError } from '@/api/http'

// P6：訂單還在離線佇列裡等待第一次同步時，伺服端根本沒有這筆訂單，
// 編輯狀態／刪除都會收到 404——用同一句話提示，不用另外做「排入佇列
// 稍後重試」（見 api/orders.ts 的說明）。
function orderApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 404) {
    return '這筆訂單可能還在等待同步到伺服端，請稍後再試一次'
  }
  if (err instanceof ApiError) {
    return `操作失敗：${err.message}`
  }
  return '連不上伺服端，請確認網路連線'
}

// 分頁相關功能
// 當前頁數
const currentPage = ref(1)
// 頁數切換
const handleCurrentChange = (page: number) => {
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
// D-05：篩選字串含正規表示式特殊字元（如 "("）時，String.match() 會把它當
// pattern 編譯，丟出 SyntaxError 讓整頁掛掉。這裡只需要單純的子字串比對，
// 改用 includes() 就不會誤把使用者輸入當成正規表示式解析。
const filterOrder = computed(() => {
  return orderStore.order.filter(item => {
    return item.orderId.includes(filterOrderId.value) &&
      item.orderTime.includes(filterOrderTime.value) &&
      item.staff.includes(filterOrderStaff.value) &&
      item.orderStatus.includes(filterOrderStatus.value) &&
      item.orderPayment.includes(filterOrderPayMethod.value)
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
// 編輯訂單狀態（P6：改成真的呼叫伺服端，見 api/orders.ts 的說明）
const editOrderStatus = (id: string) => {
  ElMessageBox.confirm(
    '請選擇當前的訂單狀態',
    '修改訂單狀態',
    {
      confirmButtonText: '已完成',
      cancelButtonText: '已取消',
      type: 'info',
    }
  ).then(async () => {
    try {
      await updateOrderStatus(id, '已完成')
      orderStore.order.find(item => item.orderId === id)!.orderStatus = '已完成'
      ElMessage.success('訂單狀態已設定為已完成')
    } catch (err) {
      ElMessage.error(orderApiErrorMessage(err))
    }
  }).catch(async (reason) => {
    // ElMessageBox 的 catch 同時涵蓋「點了取消按鈕」跟「直接關掉視窗」，
    // 這裡沿用既有行為：只有明確點取消按鈕（reason === 'cancel'）才當
    // 「使用者選了已取消」，避免關掉視窗也被當成一次狀態異動。
    if (reason !== 'cancel') return
    try {
      await updateOrderStatus(id, '已取消')
      orderStore.order.find(item => item.orderId === id)!.orderStatus = '已取消'
      ElMessage.success('訂單狀態已設定為已取消')
    } catch (err) {
      ElMessage.error(orderApiErrorMessage(err))
    }
  })
}
// 刪除訂單（P6：改成真的呼叫伺服端，見 api/orders.ts 的說明）
const deleteOrder = (id: string) => {
  ElMessageBox.confirm(
    '是否要該筆刪除訂單?',
    '警告',
    {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteOrderRequest(id)
      orderStore.order = orderStore.order.filter(item => item.orderId != id)
      ElMessage.success('刪除成功')
    } catch (err) {
      ElMessage.error(orderApiErrorMessage(err))
    }
  }).catch(() => {
    ElMessage.error('取消操作')
  })
}

</script>

<style scoped></style>