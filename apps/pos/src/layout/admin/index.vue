<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
    <AdminSidebar />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AdminTopbar />
      <!-- 後台頁面統一的外層捲動容器，避免內層頁面巢狀捲動 -->
      <main class="min-h-0 flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'
</script>
