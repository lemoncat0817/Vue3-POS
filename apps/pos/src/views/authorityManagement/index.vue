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
      </div>

      <div class="w-full rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm min-h-[640px] flex overflow-hidden">
        <PermissionManagement class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PermissionManagement from './permissionManagement/index.vue'
</script>

<style scoped></style>
