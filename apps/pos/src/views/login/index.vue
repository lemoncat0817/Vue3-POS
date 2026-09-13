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

      <!-- 忘記 PIN 的救援面板：靠 OAuth 登入核發的 web session 重設任一員工的 PIN，
           不需要先知道舊 PIN（見 apps/api/src/middleware/require-capability.ts 的
           allowWebSession）。只在使用者主動點「忘記 PIN？」之後才顯示，不會在
           拿到 web session 當下就自動蓋掉正常的 PIN 登入畫面。 -->
      <template v-else-if="showResetPin">
        <p class="mb-4 text-center text-sm text-surface-500 dark:text-surface-400">
          選擇員工並輸入新 PIN，重設後請改用新 PIN 登入。
        </p>
        <form class="flex flex-col gap-4" @submit.prevent="submitResetPin">
          <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
            員工
            <select
              v-model="resetPinStaffId"
              class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
            >
              <option value="" disabled>請選擇員工</option>
              <option v-for="item in resetPinStaffList" :key="item.id" :value="item.id">
                {{ item.jobTitle }} - {{ item.name }}（{{ item.account }}）
              </option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm font-bold text-surface-600 dark:text-surface-300">
            新 PIN
            <input
              v-model="resetPinValue"
              placeholder="請輸入新 PIN"
              type="password"
              inputmode="numeric"
              maxlength="6"
              class="rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-center text-lg font-bold tracking-[0.3em] text-surface-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
            />
          </label>
          <button
            type="submit"
            :disabled="resetPinLoading"
            class="rounded-lg bg-primary-600 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            重設 PIN
          </button>
          <button
            type="button"
            class="text-center text-xs font-bold text-surface-400 hover:text-surface-600 hover:underline dark:hover:text-surface-200"
            @click="showResetPin = false"
          >
            取消，改用 PIN 登入
          </button>
        </form>
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

        <!-- 次要入口收在這裡、預設收合，PIN 登入才是這個畫面該優先看到的
             內容。重點是收合狀態只能拿掉「說明文字」，不能拿掉任何一個
             出口──webSessionToken 存在只代表多一條「直接重設」的捷徑，
             換裝置／換帳號的 OAuth 連結永遠要在展開後留著，不然像這次
             一樣，登過一次後 12 小時內想換成別的 Google 帳號就沒路可走。 -->
        <div class="mt-6 border-t border-surface-200 pt-4 dark:border-surface-700">
          <button
            v-if="!showDeviceHelp"
            type="button"
            class="w-full text-center text-xs font-bold text-surface-400 hover:text-surface-600 hover:underline dark:hover:text-surface-200"
            @click="showDeviceHelp = true"
          >
            忘記 PIN 或需要換裝置／換帳號？
          </button>
          <div v-else class="flex flex-col gap-3">
            <!-- 有 webSessionToken 代表最近登入過、還在 12 小時效期內，多一條
                 不必重新走 OAuth 的捷徑；沒有的話就只有下面的 OAuth 連結。 -->
            <button
              v-if="deviceStore.webSessionToken"
              type="button"
              class="w-full rounded-lg border border-surface-300 py-2 text-center text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="openResetPin"
            >
              忘記 PIN？直接重設（沿用目前的管理者登入）
            </button>
            <div class="flex flex-col gap-1">
              <p class="text-center text-xs text-surface-400 dark:text-surface-500">
                換一台裝置，或改用別的 Google／GitHub 帳號：
              </p>
              <div class="flex gap-2">
                <a
                  :href="googleLoginUrl"
                  class="flex-1 rounded-lg border border-surface-300 py-2 text-center text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  Google 登入
                </a>
                <a
                  :href="githubLoginUrl"
                  class="flex-1 rounded-lg border border-surface-300 py-2 text-center text-xs font-bold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  GitHub 登入
                </a>
              </div>
            </div>
            <button
              type="button"
              class="text-center text-xs font-bold text-surface-400 hover:text-surface-600 hover:underline dark:hover:text-surface-200"
              @click="showDeviceHelp = false"
            >
              收合
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
import { useQueryClient } from '@tanstack/vue-query'
import { useLoginStore } from '@/stores/login'
import { useDeviceStore } from '@/stores/device'
const loginStore = useLoginStore()
const deviceStore = useDeviceStore()
const queryClient = useQueryClient()
import { showToast } from '@/composables/useToast'
import { operatorLogin, toStaffMember } from '@/api/auth'
import { fetchStaffList, updateStaff } from '@/api/staff'
import { googleLoginUrl, githubLoginUrl } from '@/api/oauth'
import { ApiError, apiErrorMessage } from '@/api/http'
import type { Staff } from '@pos/contract'

const RESET_PIN_PATTERN = /^\d{4,6}$/
const showResetPin = ref(false)
const showDeviceHelp = ref(false)
const resetPinStaffList = ref<Staff[]>([])
const resetPinStaffId = ref('')
const resetPinValue = ref('')
const resetPinLoading = ref(false)

async function openResetPin() {
  showResetPin.value = true
  try {
    resetPinStaffList.value = await fetchStaffList()
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
    showResetPin.value = false
  }
}

async function submitResetPin() {
  const target = resetPinStaffList.value.find((item) => item.id === resetPinStaffId.value)
  if (!target) {
    showToast('請選擇要重設 PIN 的員工', 'error')
    return
  }
  if (!RESET_PIN_PATTERN.test(resetPinValue.value)) {
    showToast('PIN 必須是 4 到 6 碼數字', 'error')
    return
  }
  resetPinLoading.value = true
  try {
    await updateStaff(target.id, {
      name: target.name,
      jobTitle: target.jobTitle,
      account: target.account,
      roleId: target.roleId,
      pin: resetPinValue.value
    })
    showToast(`已重設「${target.name}」的 PIN，請改用新 PIN 登入`, 'success')
    // 用過即丟：這組 web session 的用途就是救援 PIN，重設完沒有理由繼續留著。
    deviceStore.webSessionToken = null
    resetPinStaffId.value = ''
    resetPinValue.value = ''
    showResetPin.value = false
  } catch (err) {
    showToast(apiErrorMessage(err), 'error')
  } finally {
    resetPinLoading.value = false
  }
}

// 新租戶核發 owner 帳號時強制覆蓋，避免殘留舊帳號。
watch(
  () => deviceStore.pendingOwnerAccount,
  (value) => {
    if (value) loginStore.account = value
  },
  { immediate: true }
)

function acknowledgeOwnerCredentials() {
  deviceStore.clearPendingOwnerCredentials()
}

const login = async () => {
  // 提前攔截未填寫狀態，避免 zod 拋錯導致非預期的錯誤提示。
  if (!loginStore.account.trim() || !loginStore.pin.trim()) {
    showToast('請輸入帳號與 PIN', 'error')
    return
  }
  try {
    const staff = await operatorLogin(loginStore.account, loginStore.pin)
    loginStore.userInfo = toStaffMember(staff)
    loginStore.sessionToken = staff.sessionToken
    loginStore.isLogin = true
    // 登入時強制刷新 roles 與 staff 快取，避免角色權限管理顯示舊設定。
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    ])
    router.push('/home')
    showToast(`登入成功：${staff.jobTitle} - ${staff.name}，歡迎進入 POS機系統`, 'success')
  } catch (err) {
    loginStore.isLogin = false
    loginStore.userInfo = []
    loginStore.sessionToken = null
    if (err instanceof ApiError && err.status === 401) {
      showToast('帳號或是 PIN 有誤,請重新輸入', 'error')
    } else {
      showToast(apiErrorMessage(err), 'error')
    }
  }
}
</script>
