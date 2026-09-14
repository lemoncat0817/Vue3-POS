import './styles/reset.scss'
import './styles/style.scss'

import { logVersionBadge } from '@/utils/version'
logVersionBadge()

// 攔截 Chromium DevTools 即時指標 (Core Web Vitals) 或擴充套件在 SPA 軟導航時注入的已知例外，避免干擾控制台
window.addEventListener('error', (event) => {
  const message = typeof event.message === 'string' ? event.message : ''
  const errorMsg = event.error instanceof Error ? event.error.message : ''
  const stack = event.error instanceof Error ? event.error.stack : ''
  if (
    message.includes("reading 'startTime'") ||
    errorMsg.includes("reading 'startTime'") ||
    (typeof stack === 'string' && stack.includes('reportAllChanges') && stack.includes('startTime'))
  ) {
    event.preventDefault()
  }
})

// 掛載與初始化前同步讀取本機裝置憑證至 http client。
import { primeDeviceTokenFromStorage } from './stores/device'
primeDeviceTokenFromStorage()

import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

import { useDeviceStore } from './stores/device'
import { useLoginStore } from './stores/login'
import { consumeOAuthCallback } from './api/oauth'
import { showToast } from '@/composables/useToast'
const oauthResult = consumeOAuthCallback(useDeviceStore())
if (oauthResult.status === 'error') {
  showToast('登入失敗，請重新嘗試 Google／GitHub 登入', 'error')
} else if (oauthResult.status === 'success' && !oauthResult.isNewTenant) {
  // 既有租戶重新走一次 OAuth，最常見的原因就是忘記 PIN 想救援，所以順便展開登入頁的「直接重設」入口。
  useDeviceStore().justAuthenticatedViaOAuth = true
  const loginStore = useLoginStore()
  loginStore.account = ''
  loginStore.pin = ''
  showToast('裝置配對成功，請用員工帳號 PIN 登入；忘記 PIN 可以點下方「直接重設」', 'success')
}

import router from './router'
app.use(router)
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin)
app.mount('#app')

import { registerSW } from 'virtual:pwa-register'
import { confirm } from '@/composables/useConfirm'
const updateSW = registerSW({
  onNeedRefresh() {
    confirm({
      title: '有新版本可以使用',
      description: '點「立即套用」即可套用最新版本，購物車與待同步的訂單不會遺失。',
      confirmText: '立即套用',
      cancelText: '稍後再說'
    }).then((result) => {
      if (result === 'confirm') updateSW(true)
    })
  }
})
