import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Vue3-POS/',
  plugins: [
    vue(),
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
        name: 'POS 點餐系統',
        short_name: 'POS',
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
