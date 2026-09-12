<template>
  <!-- 捲動由外層 Shell 統一負責，避免巢狀捲動容器 -->
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm"
      >
        <div>
          <h1
            class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight"
          >
            後台設定
          </h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            維護商品目錄、行銷折扣活動、電子發票期別字軌與付款方式
          </p>
        </div>

        <!-- 分段導覽：按鈕文字供 e2e 測試定位 -->
        <div class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="
              settingStore.currentSettingPage === 0
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            "
            @click="settingStore.currentSettingPage = 0"
          >
            <Coffee class="h-4 w-4" />
            <span>商品管理</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="
              settingStore.currentSettingPage === 1
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            "
            @click="settingStore.currentSettingPage = 1"
          >
            <Percent class="h-4 w-4" />
            <span>優惠設定</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="
              settingStore.currentSettingPage === 2
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            "
            @click="settingStore.currentSettingPage = 2"
          >
            <Receipt class="h-4 w-4" />
            <span>電子發票字軌</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="
              settingStore.currentSettingPage === 3
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            "
            @click="settingStore.currentSettingPage = 3"
          >
            <CreditCard class="h-4 w-4" />
            <span>付款方式</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="
              settingStore.currentSettingPage === 4
                ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            "
            @click="settingStore.currentSettingPage = 4"
          >
            <Clock class="h-4 w-4" />
            <span>營業設定</span>
          </button>
        </div>
      </div>

      <div class="w-full flex flex-col">
        <ProductManagement v-if="settingStore.currentSettingPage === 0" class="w-full" />
        <OfferSetting v-if="settingStore.currentSettingPage === 1" class="w-full" />
        <InvoiceTrackSetting v-if="settingStore.currentSettingPage === 2" class="w-full" />
        <PaymentMethodSetting v-if="settingStore.currentSettingPage === 3" class="w-full" />
        <BusinessHourSetting v-if="settingStore.currentSettingPage === 4" class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, Coffee, CreditCard, Percent, Receipt } from 'lucide-vue-next'
import ProductManagement from './productManagement/index.vue'
import OfferSetting from './offerSetting/index.vue'
import InvoiceTrackSetting from './invoiceTrackSetting/index.vue'
import PaymentMethodSetting from './paymentMethodSetting/index.vue'
import BusinessHourSetting from './businessHourSetting/index.vue'
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style scoped></style>
