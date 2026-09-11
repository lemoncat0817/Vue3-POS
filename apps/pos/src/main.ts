import './styles/reset.scss'
import './styles/style.scss'

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

// 全部其他程式碼（尤其是 App.vue 掛載後 useQuery 立刻送出的那批請求）
// 之前，同步把 localStorage 裡的裝置憑證讀進 http.ts——見 primeDeviceTokenFromStorage()
// 的說明，不能賭 Pinia 的 persistedstate hydrate 一定會在那之前跑完。
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

// 把 Google／GitHub 登入導回網址上的裝置憑證讀進 deviceStore（跟上面的
// primeDeviceTokenFromStorage 是兩件事：這裡處理的是「剛登入完成」這次的
// 新憑證，上面處理的是「之前登入過，這次重新整理頁面」要延續舊憑證）。
import { useDeviceStore } from './stores/device'
import { consumeOAuthCallback } from './api/oauth'
import { showToast } from '@/composables/useToast'
const oauthResult = consumeOAuthCallback(useDeviceStore())
if (oauthResult.status === 'error') {
  showToast('登入失敗，請重新嘗試 Google／GitHub 登入', 'error')
} else if (oauthResult.status === 'success' && !oauthResult.isNewTenant) {
  showToast('裝置配對成功，請用員工帳號 PIN 登入', 'success')
}

import router from './router'
app.use(router)
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin)
app.mount('#app')

// PWA 新版本提示，由使用者確認後再重新整理套用。
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
