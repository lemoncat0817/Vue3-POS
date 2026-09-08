<template>
  <div class="w-full flex flex-col items-center overflow-y-auto bg-surface-50/50 dark:bg-surface-950 px-4 py-6 min-h-[calc(100vh-64px)]">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <!-- 頂部標題與總覽卡 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">權限管理</h1>
            <span class="rounded-full bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              安全與角色
            </span>
          </div>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            門市操作人員帳號、職稱權限分配與支援支付管道維護
          </p>
        </div>

        <div class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
            @click="authorityManagementStore.currentAuthorityManagementPage = 0">
            <Users class="h-4 w-4" />
            <span>人員及付款方式管理</span>
          </button>
        </div>
      </div>

      <!-- 內容面板 -->
      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[640px] flex overflow-hidden">
        <PermissionManagement v-if="authorityManagementStore.currentAuthorityManagementPage === 0" class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users } from 'lucide-vue-next'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
import PermissionManagement from './permissionManagement/index.vue'

const authorityManagementStore = useAuthorityManagementStore()
</script>

<style scoped></style>
