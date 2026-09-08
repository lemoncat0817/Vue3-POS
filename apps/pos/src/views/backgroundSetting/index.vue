<template>
  <div class="w-full flex flex-col items-center overflow-y-auto bg-surface-50/50 dark:bg-surface-950 px-4 py-6 min-h-[calc(100vh-64px)]">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <!-- 頂部標題與分頁導航卡 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">後台設定</h1>
            <span class="rounded-full bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              系統配置
            </span>
          </div>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            維護飲品品項目錄、行銷折扣活動與電子發票期別字軌
          </p>
        </div>

        <!-- 現代化分段標籤導覽 (精確維持按鈕文字以完全相容 e2e 測試) -->
        <div class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="settingStore.currentSettingPage === 0
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'"
            @click="settingStore.currentSettingPage = 0">
            <Coffee class="h-4 w-4" />
            <span>商品管理</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="settingStore.currentSettingPage === 1
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'"
            @click="settingStore.currentSettingPage = 1">
            <Percent class="h-4 w-4" />
            <span>優惠設定</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="settingStore.currentSettingPage === 2
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'"
            @click="settingStore.currentSettingPage = 2">
            <Receipt class="h-4 w-4" />
            <span>電子發票字軌</span>
          </button>
        </div>
      </div>

      <!-- 設定子內容卡片 (解除固定 h-[600px] 限制) -->
      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[640px] flex overflow-hidden">
        <ProductManagement v-if="settingStore.currentSettingPage === 0" class="w-full" />
        <OfferSetting v-if="settingStore.currentSettingPage === 1" class="w-full" />
        <InvoiceTrackSetting v-if="settingStore.currentSettingPage === 2" class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Coffee, Percent, Receipt } from 'lucide-vue-next'
import ProductManagement from './productManagement/index.vue'
import OfferSetting from './offerSetting/index.vue'
import InvoiceTrackSetting from './invoiceTrackSetting/index.vue'
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style scoped></style>
