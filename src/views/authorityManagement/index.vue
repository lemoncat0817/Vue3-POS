<template>
  <div class="w-full flex items-center flex-col overflow-y-auto ">
    <div class="w-4/5 mt-10 flex flex-col items-center">
      <h1
        class="text-3xl text-white font-bold text-center border-2 border-solid border-black rounded-lg bg-red-500 px-2">
        權限管理</h1>
      <div class="mt-5 flex">
        <div @click="authorityManagementStore.currentAuthorityManagementPage = 0"
          class="px-2 border-2 border-solid border-black text-center mx-3 text-blue-800 bg-red-500 rounded-lg font-bold text-2xl cursor-pointer select-none"
          :class="{ 'bg-yellow-400': authorityManagementStore.currentAuthorityManagementPage === 0 }">
          人員及付款方式管理</div>
      </div>
    </div>
    <div v-if="authorityManagementStore.currentAuthorityManagementPage === 0"
      class="w-[90%] h-[600px] mt-6 border-2 border-solid border-black rounded-lg flex ">
      <PermissionManagement />
    </div>
  </div>
</template>

<script setup>
import { useAuthorityManagementStore } from '@/stores/authorityManagement'
const authorityManagementStore = useAuthorityManagementStore()
import PermissionManagement from './permissionManagement/index.vue'

</script>

<style scoped></style>