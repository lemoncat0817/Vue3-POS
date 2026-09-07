<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex flex-col items-center">
      <h1 class="text-3xl font-black text-surface-900 dark:text-surface-100">
        權限管理</h1>
      <div class="mt-5 flex">
        <button
          type="button"
          class="rounded-lg px-4 py-2 mx-1 text-lg font-bold transition-colors"
          :class="authorityManagementStore.currentAuthorityManagementPage === 0
            ? 'bg-primary-600 text-white'
            : 'bg-white text-surface-600 border border-surface-300 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700 dark:hover:bg-surface-700'"
          @click="authorityManagementStore.currentAuthorityManagementPage = 0">
          人員及付款方式管理</button>
      </div>
    </div>
    <div
v-if="authorityManagementStore.currentAuthorityManagementPage === 0"
      class="w-[90%] h-[600px] mt-6 rounded-lg border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 flex ">
      <PermissionManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import PermissionManagement from './permissionManagement/index.vue'

</script>

<style scoped></style>
