// styles
import './styles/reset.scss'
import './styles/style.scss'
// Element Plus 的完整樣式表。元件本身改成 on-demand 匯入（見下方
// 說明），但樣式刻意不比照逐元件拆分，見下方 D-16 的說明。
import 'element-plus/dist/index.css'
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
// Element Plus
//
// P7（D-16）：原本這裡 `app.use(ElementPlus, {...})` 全域註冊每一個
// 元件——現在改成 vite.config.ts 的 unplugin-vue-components
// （ElementPlusResolver）掃描模板用到的 `<el-xxx>` 標籤，各元件在各自
// 的 .vue 檔案第一次用到時才個別匯入，不需要在這裡整批安裝。全域語系
// 設定原本靠 `app.use(ElementPlus, {locale: zhTw})` 一次帶入，改用
// `<el-config-provider :locale="zhTw">` 包住根元件（見 App.vue），這是
// on-demand 匯入下 Element Plus 官方文件建議的全域語系設定方式。
//
// icons-vue 原本 `import * as ElementPlusIconsVue` 把全部圖示元件註冊成
// 全域元件——這個專案的畫面實際上沒有任何地方用到任何一個圖示（grep
// 不到任何 <XxxIcon> 標籤或 :icon="Xxx" 用法），整包純屬沒用到的死重量，
// 直接刪除，不需要改成 on-demand（沒有使用點可以掃描）。

app.mount('#app')

// PWA 更新策略（P3，見 vite.config.ts 的 VitePWA 設定說明：registerType
// 選 'prompt'，不背景默默重新整理，交由使用者自己決定何時套用）。
import { registerSW } from 'virtual:pwa-register'
import { ElNotification } from 'element-plus'
const updateSW = registerSW({
  onNeedRefresh() {
    ElNotification({
      title: '有新版本可以使用',
      message: '點這裡重新整理即可套用最新版本，購物車與待同步的訂單不會遺失。',
      type: 'info',
      duration: 0,
      onClick: () => updateSW(true),
    })
  },
})
