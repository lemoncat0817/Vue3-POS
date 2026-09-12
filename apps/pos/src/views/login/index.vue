<template>
  <div
    class="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-overlay dark:bg-surface-900">
      <div class="mb-8 flex flex-col items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
          POS 系統
        </h1>
      </div>

      <!-- 新租戶第一次用 Google／GitHub 登入時，後端隨裝置一起核發一組 owner
           帳號／PIN（見 stores/device.ts），只顯示這一次，關掉就沒了。 -->
      <div
        v-if="deviceStore.pendingOwnerAccount && deviceStore.pendingOwnerPin"
        class="mb-6 rounded-lg border border-warning-300 bg-warning-50 p-4 text-sm dark:border-warning-800 dark:bg-warning-950"
      >
        <p class="font-bold text-warning-800 dark:text-warning-300">
          歡迎第一次使用！系統已經幫您建好一組店長帳號，請先記下來（只會顯示這一次）：
        </p>
        <p class="mt-2 font-mono text-base text-warning-900 dark:text-warning-100">
          帳號：{{ deviceStore.pendingOwnerAccount }}／PIN：{{ deviceStore.pendingOwnerPin }}
        </p>
        <button
          type="button"
          class="mt-3 rounded-lg bg-warning-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-warning-700"
          @click="acknowledgeOwnerCredentials"
        >
          我已經記下來了
        </button>
      </div>

      <!-- 還沒配對過這台瀏覽器（沒有裝置憑證）時，PIN 登入打不了任何 API
           （見 router/index.ts 的導頁邏輯），只顯示 OAuth 入口。 -->
      <template v-if="!deviceStore.deviceToken">
        <p class="mb-4 text-center text-sm text-surface-500 dark:text-surface-400">
          第一次使用這台瀏覽器，請先用 Google 或 GitHub 登入以配對裝置。
        </p>
        <div class="flex flex-col gap-3">
          <a
            :href="googleLoginUrl"
            class="rounded-lg border border-surface-300 py-2.5 text-center text-sm font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            使用 Google 登入
          </a>
          <a
            :href="githubLoginUrl"
            class="rounded-lg border border-surface-300 py-2.5 text-center text-sm font-bold text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            使用 GitHub 登入
          </a>
        </div>
      </template>

      <template v-else>
        <form class="flex flex-col gap-4" @submit.prevent="login">
          <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
            帳號
            <input
              v-model="loginStore.account"
              placeholder="請輸入帳號"
              autocomplete="username"
              class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-center text-lg font-bold text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
            PIN
            <input
              v-model="loginStore.pin"
              placeholder="請輸入 PIN"
              type="password"
              inputmode="numeric"
              maxlength="6"
              autocomplete="current-password"
              class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-center text-lg font-bold tracking-[0.3em] text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
            />
          </label>
          <label class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
            <input
              v-model="loginStore.rememberAccount"
              type="checkbox"
              class="h-4 w-4 rounded border-surface-300"
            />
            記住帳號
          </label>
          <button
            type="submit"
            class="rounded-lg bg-primary-600 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            登入
          </button>
        </form>

        <div class="mt-6 flex flex-col gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
          <a
            :href="googleLoginUrl"
            class="text-center text-xs font-bold text-surface-400 hover:text-surface-600 hover:underline dark:hover:text-surface-200"
          >
            換一台裝置？重新用 Google 登入
          </a>
          <a
            :href="githubLoginUrl"
            class="text-center text-xs font-bold text-surface-400 hover:text-surface-600 hover:underline dark:hover:text-surface-200"
          >
            重新用 GitHub 登入
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
import { useLoginStore } from '@/stores/login'
import { useDeviceStore } from '@/stores/device'
const loginStore = useLoginStore()
const deviceStore = useDeviceStore()
import { showToast } from '@/composables/useToast'
import { operatorLogin, toStaffMember } from '@/api/auth'
import { googleLoginUrl, githubLoginUrl } from '@/api/oauth'
import { ApiError } from '@/api/http'

function acknowledgeOwnerCredentials() {
  loginStore.account = deviceStore.pendingOwnerAccount ?? ''
  deviceStore.clearPendingOwnerCredentials()
}

const login = async () => {
  try {
    const staff = await operatorLogin(loginStore.account, loginStore.pin)
    loginStore.userInfo = toStaffMember(staff)
    loginStore.sessionToken = staff.sessionToken
    loginStore.isLogin = true
    router.push('/home')
    showToast(`登入成功：${staff.jobTitle} - ${staff.name}，歡迎進入 POS機系統`, 'success')
  } catch (err) {
    loginStore.isLogin = false
    loginStore.userInfo = []
    loginStore.sessionToken = null
    if (err instanceof ApiError && err.status === 401) {
      showToast('帳號或是 PIN 有誤,請重新輸入', 'error')
    } else {
      showToast('連不上伺服端，請確認網路連線', 'error')
    }
  }
}
</script>
