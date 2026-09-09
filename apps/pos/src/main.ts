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

import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
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
      cancelText: '稍後再說',
    }).then((result) => {
      if (result === 'confirm') updateSW(true)
    })
  },
})
