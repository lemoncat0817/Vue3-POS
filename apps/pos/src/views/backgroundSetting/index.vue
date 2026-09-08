<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex flex-col items-center">
      <h1 class="text-3xl font-black text-surface-900 dark:text-surface-100">
        後台設定</h1>
      <div class="mt-5 flex">
        <button
          type="button"
          class="rounded-lg px-4 py-2 mx-1 text-lg font-bold transition-colors"
          :class="settingStore.currentSettingPage === 0
            ? 'bg-primary-600 text-white'
            : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700 dark:hover:bg-surface-700'"
          @click="settingStore.currentSettingPage = 0">
          商品管理</button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 mx-1 text-lg font-bold transition-colors"
          :class="settingStore.currentSettingPage === 1
            ? 'bg-primary-600 text-white'
            : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700 dark:hover:bg-surface-700'"
          @click="settingStore.currentSettingPage = 1">
          優惠設定</button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 mx-1 text-lg font-bold transition-colors"
          :class="settingStore.currentSettingPage === 2
            ? 'bg-primary-600 text-white'
            : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700 dark:hover:bg-surface-700'"
          @click="settingStore.currentSettingPage = 2">
          電子發票字軌</button>
      </div>
    </div>
    <div
v-if="settingStore.currentSettingPage === 0"
      class="2xl:w-4/5 xl:w-[90%] w-[95%] h-[600px] mt-6 rounded-lg border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 flex ">
      <ProductManagement />
    </div>
    <div
v-if="settingStore.currentSettingPage === 1"
      class="2xl:w-4/5 xl:w-[90%] w-[95%] h-[600px] mt-6 rounded-lg border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 flex ">
      <OfferSetting />
    </div>
    <div
v-if="settingStore.currentSettingPage === 2"
      class="2xl:w-4/5 xl:w-[90%] w-[95%] h-[600px] mt-6 rounded-lg border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 flex ">
      <InvoiceTrackSetting />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductManagement from './productManagement/index.vue'
import OfferSetting from './offerSetting/index.vue'
import InvoiceTrackSetting from './invoiceTrackSetting/index.vue'
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style scoped></style>
