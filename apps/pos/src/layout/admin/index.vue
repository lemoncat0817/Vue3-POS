<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
    <AdminSidebar />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AdminTopbar />
      <!-- 唯一的捲動容器（規劃書 B-7／B-8）：後台六個頁面自己的根節點
           不再各自 overflow-y-auto + min-h-[calc(100vh-64px)]（每個都要
           手動複製一次 header 高度、且跟這裡巢狀出兩層捲動容器），一律
           只在這裡捲動。 -->
      <main class="min-h-0 flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// UI-3（規劃書 §4.1「後台 Shell」）：訂單／後台設定／數據分析／權限
// 管理／會員管理／桌況管理六個後台頁面的共用外層——取代原本跟點餐
// 首頁共用同一條水平頂部列導覽的做法。點餐首頁維持 layout/index.vue
// ＋ layout/header/index.vue 不變（規劃書 §3.1：點餐頁是觸控主戰場，
// 需要全寬，不適合被側邊欄吃掉 200px）。
import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'
</script>
