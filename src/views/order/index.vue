<template>
  <div class="w-full flex items-center flex-col overflow-y-auto">
    <div class="w-4/5 mt-10 bg-red-300">
      <h1 class="text-3xl font-bold">訂單</h1>
      {{ orderStore.order }}
    </div>
    <div class="w-4/5 mt-10 bg-red-300">
      <h1 class="text-3xl font-bold">
        <el-table :data="orderStore.order" style="width: 100%">
          <el-table-column label="訂單編號" width="180" />
          <el-table-column label="訂單時間" width="180" />
          <el-table-column label="服務人員" width="180" />
          <el-table-column label="訂單狀態" width="180" />
          <el-table-column label="訂單金額" width="180" />
          <el-table-column label="付款方式" width="180" />
          <el-table-column label="詳細資料" width="180" />
          <el-table-column label="操作" width="180" />
        </el-table>
      </h1>
    </div>
  </div>
</template>

<script setup>
import { useOrderStore } from "@/stores/order"
const orderStore = useOrderStore()


</script>

<style lang="scss" scoped></style>