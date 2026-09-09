<template>
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
    <div class="w-full max-w-7xl flex flex-col gap-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black text-surface-900 dark:text-surface-100 tracking-tight">權限管理</h1>
          <p class="mt-1 text-xs lg:text-sm text-surface-500 dark:text-surface-400">
            門市操作人員帳號、職稱與權限分配
          </p>
        </div>

        <!-- 分段導覽：按鈕文字供 e2e 測試定位 -->
        <div class="flex items-center gap-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 p-1">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="authorityManagementStore.currentTab === 'staff'
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'"
            @click="authorityManagementStore.currentTab = 'staff'">
            <Users class="h-4 w-4" />
            <span>人員管理</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs lg:text-sm font-bold transition-all select-none"
            :class="authorityManagementStore.currentTab === 'roles'
              ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'"
            @click="authorityManagementStore.currentTab = 'roles'">
            <ShieldCheck class="h-4 w-4" />
            <span>權限群組</span>
          </button>
        </div>
      </div>

      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[640px] flex overflow-hidden">
        <StaffManagement v-if="authorityManagementStore.currentTab === 'staff'" class="w-full" />
        <RoleGroupManagement v-else class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, ShieldCheck } from 'lucide-vue-next'
import StaffManagement from './staffManagement/index.vue'
import RoleGroupManagement from './roleGroupManagement/index.vue'
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
</script>

<style scoped></style>
