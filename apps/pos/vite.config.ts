import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Vue3-POS/',
  plugins: [
    vue(),
    // P7（D-16）：main.ts 原本 `import ElementPlus from 'element-plus'` 把
    // 全部元件（Table、Cascader、Upload、Steps、Carousel、ColorPicker……
    // 這個專案其實只用到 13 種，見 grep <el-xxx> 的結果）一次全部打進
    // bundle、全域註冊。改成用 unplugin-vue-components 掃描模板實際用到
    // 哪些 `<el-xxx>` 標籤，只匯入、只註冊那些——不用逐一修改每個頁面的
    // `<script>`，因為這是掃描模板標籤自動處理，不是手動搬。以函式呼叫
    // 使用的 API（ElMessage／ElMessageBox／ElNotification）不是模板標籤，
    // 這個 resolver 管不到，現行程式碼本來就在各檔案自己
    // `import { ElMessage } from 'element-plus'`，維持原樣不受影響。
    // CSS 刻意不比照改成逐元件匯入——main.ts 仍然載入完整的
    // element-plus/dist/index.css，避免為了 CSS 的邊際 bundle 減幅去對
    // ElMessage 這類函式呼叫額外手動配置每個元件的樣式匯入，增加出錯
    // 風險；D-16 真正要處理的「幾百 KB 起跳的巨大 JS chunk」問題在 JS
    // 這一側，不在 CSS。
    //
    // dts 刻意關掉：打開後 vue-tsc 會拿到 Element Plus 元件的真正型別
    // （透過產生的 GlobalComponents 宣告），連帶讓一批目前完全沒被檢查
    // 過的既有模板型別問題浮出來（例如 el-table 的 current-change 事件
    // 型別其實是 `T | null`，但現有 handler 只接受 `T`；el-checkbox-group
    // 的 v-model 型別跟 authorityCheckList 對不上；幾個地方傳了舊版
    // Element UI 的 size 字面值）——這些是既有缺陷，不是這次改動造成的，
    // 但修好它們是一份獨立、需要逐一檢視每個案例的工作，不屬於 D-16
    // 「減少 bundle 大小」的範圍，這裡不夾帶進來。維持 dts:false 讓
    // vue-tsc 對這些標籤的檢查程度跟改動前一樣（沒有型別資訊、不檢查），
    // 元件仍然照樣被正確解析、註冊、打進 bundle，只是不影響型別檢查。
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: false,
    }),
    // P3（規劃書 §14）：PWA 外殼——目標環境是「沒有真正硬體」的桌機
    // 瀏覽器（見 §1），離線送單（src/offline/）能不能真的派上用場，前提
    // 是應用程式本身（HTML／JS／CSS）在完全沒有網路時也載得起來，不是
    // 只有「已經載入過的分頁」才能離線運作。generateSW 預先快取建置產物
    // （見 workbox.globPatterns），navigateFallback 讓離線時對任何路徑
    // 的瀏覽器導覽（例如重新整理）都回退到 index.html，交給 vue-router
    // 自己接手決定實際畫面。
    //
    // registerType 選 'prompt' 而不是 'autoUpdate'：這是收銀機情境，
    // 背景默默重新整理可能打斷正在輸入到一半的訂單畫面（雖然購物車狀態
    // 有 Pinia 持久化不會真的遺失，但畫面被無預警重置對正在操作的店員
    // 來說仍然是干擾）。改為偵測到新版本時顯示通知，由使用者自己決定
    // 何時重新整理（見 main.ts 的 registerSW() 呼叫）。
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'MAJI Tea POS 點餐系統',
        short_name: 'MAJI POS',
        description: '單店單機使用的手搖飲點餐收銀系統',
        theme_color: '#ef4444',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        // 品項圖片目前沒有（見規劃書 §12 的視覺重構範圍），這裡先只快取
        // 建置出來的 JS／CSS／HTML／圖示，避免 glob 規則因為找不到檔案
        // 而在建置時出錯。
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
