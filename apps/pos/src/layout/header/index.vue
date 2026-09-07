<template>
  <div class="w-screen h-20 bg-red-500 flex justify-center items-center relative">
    <!-- P3：離線送單佇列的同步狀態（見 src/offline/sync-worker.ts）。平常
         佇列是空的，不佔畫面；有東西還沒送達伺服端時才顯示，讓店員知道
         「這張單其實還沒真的送出去，先別急著關電腦」。 -->
    <div
      v-if="syncStatus.pendingCount > 0"
      data-testid="sync-status"
      class="absolute right-4 top-2 flex items-center gap-1 rounded-full border-2 border-black px-3 py-1 text-sm font-bold text-blue-900 select-none"
      :class="syncStatus.lastError ? 'bg-orange-300' : 'bg-yellow-300'">
      <span v-if="syncStatus.isSyncing">同步中</span>
      <span v-else-if="syncStatus.lastError">同步失敗，將自動重試</span>
      <span v-else>等待連線同步</span>
      <span>（{{ syncStatus.pendingCount }} 筆）</span>
    </div>
    <img
src="@/assets/logo.png" alt="logo"
      class="w-16 h-4/5 rounded-lg mr-5 border-2 border-black border-solid hover:animate-spin">
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/home' }"
      @click="changePage(0)">
      <p class="text-white font-bold md:text-2xl sm:text-lg text-md">點餐</p>
    </div>
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/order' }"
      @click="changePage(1)">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">查看訂單</p>
    </div>
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/backgroundSetting' }"
      @click="changePage(2)">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">後台設定</p>
    </div>
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/dataAnalysis' }"
      @click="changePage(3)">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">數據分析</p>
    </div>
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none"
      :class="{ 'bg-yellow-500 scale-[1.2]': router.currentRoute.value.path === '/authorityManagement' }"
      @click="changePage(4)">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">權限管理</p>
    </div>
    <div
class="border-2 border-black border-solid rounded-xl px-1 mx-2 bg-red-600 cursor-pointer select-none active:bg-yellow-400"
      @click="logout">
      <p class=" text-white font-bold md:text-2xl sm:text-lg text-md">登出</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrinkStore } from '@/stores/drink'
const drinkStore = useDrinkStore()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import { useRouter } from "vue-router"
const router = useRouter()
import { confirm } from '@/composables/useConfirm'
import { showToast } from '@/composables/useToast'
import { syncStatus } from '@/offline/sync-worker'

// 切換頁面
// P7（D-12）：原本這裡每個分支都要手動同步一份 pageStore.currentPage，
// 現在「記住上次瀏覽頁籤」改由 router.afterEach 自動處理（見
// router/index.ts、stores/page.ts），這裡只需要單純導航。
// P8：組件庫替換——ElMessageBox.confirm／ElMessage 改用 composables/
// useConfirm.ts／useToast.ts（見 views/order/index.vue 的說明，同一套
// 基礎設施）。
const changePage = async (page: number) => {
  if (page === 0) {
    router.push('/home')
  }
  if (page === 1) {
    router.push('/order')
  }
  if (page === 2) {
    if (drinkStore.drinkNotPay.length != 0) {
      const result = await confirm({
        title: '警告',
        description: '前往後台設定頁面後將清空點餐頁面,是否要前往後台設定頁面?',
        confirmText: '確定前往',
        cancelText: '取消前往',
      })
      if (result !== 'confirm') {
        showToast('取消前往後台設定頁面', 'error')
        return
      }
      drinkStore.drinkNotPay = []
      router.push('/backgroundSetting')
    } else {
      router.push('/backgroundSetting')
    }
  }
  if (page === 3) {
    router.push('/dataAnalysis')
  }
  if (page === 4) {
    router.push('/authorityManagement')
  }
}

// 登出
const logout = async () => {
  const result = await confirm({
    title: '警告',
    description: '是否要登出?',
    confirmText: '登出',
    cancelText: '取消登出',
  })
  if (result !== 'confirm') {
    showToast('操作取消', 'error')
    return
  }
  router.push('/login')
  loginStore.isLogin = false
  loginStore.userInfo = []
  if (loginStore.isRememberPin === false) {
    loginStore.pin = ''
  }
  showToast('登出成功', 'success')
}
</script>

<style lang="scss" scoped></style>