<template>
  <!-- UI-3（規劃書 B-7）：捲動改由 layout/admin/index.vue 的 <main>
       統一負責，這裡不再自己 overflow-y-auto + min-h-[calc(100vh-64px)]。 -->
  <div class="w-full flex flex-col items-center bg-surface-50/50 dark:bg-surface-950 px-4 py-6">
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
      </div>

      <!-- UI-6（規劃書 §5.4「權限管理」）：這個頁面底下只有一個子頁
           （人員及付款方式管理），原本卻複製了 backgroundSetting 的
           分段頁籤容器，做出一個永遠是選中態、點了也不會切換到任何
           別處的假頁籤——純粹的版面雜訊，拿掉。 -->
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
