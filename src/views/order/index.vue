<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex justify-center">
      <h1
        class="w-20  text-3xl text-black font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500">
        訂單</h1>
    </div>
    <div class="w-4/5 mt-10 bg-red-300">
      <el-table :data="orderStore.order" style="width: 100%" height="100%" empty-text="目前無訂單">
        <el-table-column width="30" type="expand">
          <template #default="{ row }">
            <div class="flex w-full justify-center mb-2">
              <div class="text-blue-800 font-bold text-lg mx-2 flex">已買袋子數量:
                <p class="text-red-500 font-bold text-lg mx-1">{{ row.orderBagCount }}</p>個
              </div>
              <div class="text-blue-800 font-bold text-lg mx-2 flex"> 訂單原始金額: $
                <p class="text-red-500 font-bold text-lg mx-1">{{ row.orderTotalPrice }}</p>元
              </div>
              <div class="text-blue-800 font-bold text-lg mx-2 flex">已使用的優惠券:
                <p class="text-red-500 font-bold text-lg mx-1">{{ row.discountName }}</p>
              </div>
              <div class="text-blue-800 font-bold text-lg mx-2 flex">優惠券折扣金額: $
                <p class="text-red-500 font-bold text-lg mx-1">{{ row.orderDiscount }}</p>元
              </div>
              <div class="text-blue-800 font-bold text-lg mx-2 flex">顧客應付金額: $
                <p class="text-red-500 font-bold text-lg mx-1">{{ row.orderPaymentPrice }}</p>元
              </div>
            </div>
            <el-table :data="row.orderData" border style="width: 100%" empty-text="目前無待付款的飲品">
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
        <el-table-column align="center" prop="orderId" label="訂單編號" width="180" />
        <el-table-column align="center" prop="orderTime" label="訂單時間" width="180" />
        <el-table-column align="center" prop="staff" label="服務人員" width="180" />
        <el-table-column align="center" prop="orderStatus" label="訂單狀態" width="180" />
        <el-table-column align="center" label="訂單金額" width="180">
          <template #default="{ row }">
            <p>{{ row.orderPaymentPrice }} 元</p>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="orderPayment" label="付款方式" width="180" />
        <el-table-column fixed="right" align="center" label="操作" min-width="340">
          <template #default="{ row }">
            <div class="flex justify-center">
              <button @click="editOrderStatus(row.orderId)"
                class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 text-lg mx-1 px-1 select-none active:bg-yellow-300">編輯訂單狀態</button>
              <button @click="deleteOrder(row.orderId)"
                class="border-2 border-solid border-black rounded-lg text-blue-800 font-bold bg-red-400 text-lg mx-1 px-1 select-none active:bg-yellow-300">刪除訂單</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()
import { ElMessageBox, ElMessage } from 'element-plus'

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