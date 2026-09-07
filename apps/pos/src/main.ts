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
// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// element-plus 2.14 的 install() 型別簽章對 `locale` 選項的推導在
// ConfigProviderProps 的巢狀 EpPropFinalized 型別上失真，與實際執行期
// 支援的用法（官方文件的全域語系設定方式）不符，是上游型別定義的落差，
// 不是本專案的型別錯誤。以 `any` 繞過，執行期行為不受影響。
app.use(ElementPlus, {
  locale: zhTw,
} as any)

app.mount('#app')
