<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex flex-col items-center">
      <h1
        class="text-3xl text-white font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500 px-2">
        後台設定</h1>
      <div class="mt-5 flex">
        <div @click="settingStore.currentSettingPage = 0"
          class="px-2 border-2 border-solid border-black text-center mx-3 text-blue-800 bg-red-500 rounded-lg font-bold text-2xl cursor-pointer select-none"
          :class="{ 'bg-yellow-400': settingStore.currentSettingPage === 0 }">
          商品管理</div>
        <div @click="settingStore.currentSettingPage = 1"
          class="px-2 border-2 border-solid border-black text-center mx-3 text-blue-800 bg-red-500 rounded-lg font-bold text-2xl cursor-pointer select-none"
          :class="{ 'bg-yellow-400': settingStore.currentSettingPage === 1 }">
          優惠設定</div>
      </div>
      <div v-if="settingStore.currentSettingPage === 0" class="w-full h-[600px] mt-6 border-2 border-solid border-black rounded-lg flex ">
      <ProductManagement/>
      </div>
    </div>

  </div>
</template>

<script setup>
import ProductManagement from './productManagement/index.vue'
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style scoped></style>