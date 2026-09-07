// styles
import './styles/reset.scss'
import './styles/style.scss'
// App
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
// pinia
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
// Vue-router
import router from './router'
app.use(router)
// TanStack Query（P3：用戶端的伺服端狀態管理，見 src/api/）
import { VueQueryPlugin } from '@tanstack/vue-query'
app.use(VueQueryPlugin)
app.mount('#app')

// PWA 更新策略（P3，見 vite.config.ts 的 VitePWA 設定說明：registerType
// 選 'prompt'，不背景默默重新整理，交由使用者自己決定何時套用）。
//
// P8：組件庫替換——原本的 ElNotification 是「不會自動消失、點擊本體
// 才觸發更新」的通知，改用 composables/useConfirm.ts 的 confirm()：
// 語意上更明確（「立即套用」／「稍後再說」兩個按鈕），且能重用全站
// 唯一一份 ConfirmDialogHost（見 App.vue），不需要另外維護一種通知型式。
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
