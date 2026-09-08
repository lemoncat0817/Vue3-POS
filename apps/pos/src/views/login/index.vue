<template>
  <div class="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
    <!-- P11（規劃書 §12「資產處置」）：原本的 login-Bg.png 背景圖移除
         ——固定像素圖在深色模式下無法成立（圖片本身不會跟著換色），且
         省下首屏的大圖傳輸。改用 token 化的漸層背景，兩套主題都能
         正確表達。 -->
    <div v-if="isWatchVideo" class="flex flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-overlay dark:bg-surface-900">
      <iframe
width="560" height="315" src="https://www.youtube.com/embed/4ELxt64heEs?si=V5_55DrBO2G1kN0L"
        title="YouTube video player" class="rounded-lg" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
      </iframe>
      <button
        type="button" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
        @click="isWatchVideo = !isWatchVideo">回到登入頁面</button>
    </div>

    <div v-else class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-overlay dark:bg-surface-900">
      <div class="mb-8 flex flex-col items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">POS 系統</h1>
        <button
          type="button" class="text-sm font-bold text-primary-600 hover:underline dark:text-primary-400"
          @click="isWatchVideo = !isWatchVideo">觀看教學影片</button>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="login">
        <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
          帳號
          <input
            v-model="loginStore.account" placeholder="請輸入帳號" autocomplete="username"
            class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-center text-lg font-bold text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50">
        </label>
        <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
          PIN
          <input
            v-model="loginStore.pin" placeholder="請輸入 PIN" type="password" inputmode="numeric" maxlength="6"
            autocomplete="current-password"
            class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-center text-lg font-bold tracking-[0.3em] text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50">
        </label>
        <label class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
          <input v-model="loginStore.rememberAccount" type="checkbox" class="h-4 w-4 rounded border-surface-300">
          記住帳號
        </label>
        <button
          type="submit"
          class="rounded-lg bg-primary-600 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
          登入
        </button>
      </form>

      <div class="mt-6 border-t border-surface-200 pt-4 dark:border-surface-700">
        <p class="mb-2 text-center text-xs font-bold text-surface-400">快速登入（測試時使用，實際使用會移除）</p>
        <div class="flex justify-between gap-2">
          <button
            type="button" class="flex-1 rounded-lg border border-surface-300 py-1.5 text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
            @click="quicklyLogin(1)">店長(管理員)</button>
          <button
            type="button" class="flex-1 rounded-lg border border-surface-300 py-1.5 text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
            @click="quicklyLogin(2)">值班經理</button>
          <button
            type="button" class="flex-1 rounded-lg border border-surface-300 py-1.5 text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
            @click="quicklyLogin(3)">工讀生</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
import { useLoginStore } from '@/stores/login'
const loginStore = useLoginStore()
import { showToast } from '@/composables/useToast'
import { operatorLogin, toStaffMember } from '@/api/auth'
import { ApiError } from '@/api/http'

// 教學影片相關功能
const isWatchVideo = ref(false)

// 快速登入相關功能（種子資料的 PIN，見 apps/api/seed/staff.sql）
const quicklyLogin = (num: number) => {
  if (num === 1) {
    loginStore.account = 'lemon'
    loginStore.pin = '1234'
    login()
  }
  if (num === 2) {
    loginStore.account = 'james'
    loginStore.pin = '2345'
    login()
  }
  if (num === 3) {
    loginStore.account = 'emily'
    loginStore.pin = '3456'
    login()
  }

}

// P4：登入改成真的向伺服端驗證帳號＋PIN（POST /api/auth/operator-login），
// 不再是本機明碼比對（見 apps/api/README.md 的身分系統說明）。
// P8：組件庫替換——ElNotification／ElMessage 改用 composables/
// useToast.ts（見 views/order/index.vue 的說明，同一套基礎設施）；
// 原本 ElNotification 有獨立的標題＋內文兩行，這裡的 toast 只有單行
// 訊息，合併成一句。
// P11：帳號／PIN 輸入框改包進真正的 <form>（見樣板的 @submit.prevent），
// 按 Enter 就能送出，不用滑鼠點「登入」按鈕，也讓瀏覽器原生知道這是
// 一組登入表單（修掉先前「Password field is not contained in a
// form」的主控台警告）。
const login = async () => {
  try {
    const staff = await operatorLogin(loginStore.account, loginStore.pin)
    loginStore.userInfo = toStaffMember(staff)
    loginStore.isLogin = true
    router.push('/home')
    showToast(`登入成功：${staff.jobTitle} - ${staff.name}，歡迎進入 POS機系統`, 'success')
  } catch (err) {
    loginStore.isLogin = false
    loginStore.userInfo = []
    if (err instanceof ApiError && err.status === 401) {
      showToast('帳號或是 PIN 有誤,請重新輸入', 'error')
    } else {
      showToast('連不上伺服端，請確認網路連線', 'error')
    }
  }
}
</script>
